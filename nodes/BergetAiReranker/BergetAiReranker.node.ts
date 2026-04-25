import type { Callbacks } from '@langchain/core/callbacks/manager';
import { Document, type DocumentInterface } from '@langchain/core/documents';
import { BaseDocumentCompressor } from '@langchain/core/retrievers/document_compressors';
import axios from 'axios';
import {
	NodeConnectionTypes,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';
import { BERGET_API_BASE_URL, loadModelOptions } from '../BergetAi/shared';

interface BergetRerankResult {
	index: number;
	relevance_score: number;
	// Berget's runtime wraps the document in an object with { text, multi_modal },
	// even though their OpenAPI spec declares it as a bare string. We don't rely
	// on this field (we re-use the original Document from the input array via
	// the index) but type it permissively so both shapes compile.
	document?: string | { text?: string; multi_modal?: unknown };
}

/**
 * Berget's rerank response shape differs from their OpenAPI spec. Runtime
 * returns `{ results: [...] }` but the spec declares `{ data: [...] }`. We
 * accept either so this code works against the current runtime and any
 * future version that matches the spec.
 */
interface BergetRerankResponse {
	data?: BergetRerankResult[];
	results?: BergetRerankResult[];
}

/**
 * LangChain-compatible document compressor that calls Berget AI's `/v1/rerank`
 * endpoint to reorder a list of documents by relevance to a query. Plugs into
 * any n8n node that accepts an AiReranker connection type (Vector Store
 * retrievers, QA Chain, etc.).
 *
 * Berget's API returns results with 0-based indices into the input documents
 * array. We preserve the original LangChain Document metadata across the round
 * trip so downstream consumers don't lose pageContent source references.
 */
class BergetReranker extends BaseDocumentCompressor {
	private readonly apiKey: string;
	private readonly model: string;
	private readonly topN: number;
	private readonly timeoutMs: number;

	constructor(params: { apiKey: string; model: string; topN: number; timeoutMs: number }) {
		super();
		this.apiKey = params.apiKey;
		this.model = params.model;
		this.topN = params.topN;
		this.timeoutMs = params.timeoutMs;
	}

	// LangChain's tracer / callback infrastructure may JSON-serialize this
	// instance for logging. ChatOpenAI / OpenAIEmbeddings opt their apiKey
	// out via lc_secrets, but BaseDocumentCompressor has no equivalent. We
	// override toJSON() to be safe — never let the API key end up in a log.
	toJSON() {
		return {
			lc_namespace: ['berget', 'reranker'],
			model: this.model,
			topN: this.topN,
			timeoutMs: this.timeoutMs,
		};
	}

	async compressDocuments(
		documents: DocumentInterface[],
		query: string,
		_callbacks?: Callbacks,
	): Promise<DocumentInterface[]> {
		if (documents.length === 0) return [];

		const documentStrings = documents.map((d) => d.pageContent);

		const response = await axios.post<BergetRerankResponse>(
			`${BERGET_API_BASE_URL}/rerank`,
			{
				model: this.model,
				query,
				documents: documentStrings,
				top_n: Math.min(this.topN, documents.length),
				return_documents: false,
			},
			{
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					'Content-Type': 'application/json',
				},
				timeout: this.timeoutMs,
			},
		);

		const payload = response.data ?? {};
		const results: BergetRerankResult[] = payload.results ?? payload.data ?? [];

		return results.map((result) => {
			const original = documents[result.index];
			const fallbackText =
				typeof result.document === 'string'
					? result.document
					: result.document?.text ?? '';
			return new Document({
				pageContent: original?.pageContent ?? fallbackText,
				metadata: {
					...(original?.metadata ?? {}),
					relevance_score: result.relevance_score,
				},
			});
		});
	}
}

export class BergetAiReranker implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Berget AI Reranker',
		name: 'bergetAiReranker',
		icon: 'file:bergetai.svg',
		group: ['transform'],
		version: 1,
		description:
			'Rerank documents retrieved from a Vector Store using a Berget AI reranker model. Plugs into Vector Store retrievers and other nodes that accept an AiReranker connection.',
		defaults: { name: 'Berget AI Reranker' },
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Rerankers'],
			},
		},
		credentials: [{ name: 'bergetAiApi', required: true }],
		inputs: [],
		outputs: [NodeConnectionTypes.AiReranker],
		outputNames: ['Reranker'],
		properties: [
			{
				displayName:
					'This node must be connected to a Vector Store retriever or a similar parent node that accepts a reranker. It cannot be executed on its own.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getRerankModels' },
				default: '',
				required: true,
				description: 'The Berget AI reranker model to use. Fetched live from the Berget API.',
			},
			{
				displayName: 'Top N',
				name: 'topN',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 3,
				description:
					'Maximum number of documents to keep after reranking. The parent node still passes the reranker a larger candidate set; this controls how many survive the rerank step.',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Timeout (Ms)',
						name: 'timeout',
						type: 'number',
						typeOptions: { minValue: 1 },
						default: 60000,
						description: 'Maximum time in milliseconds to wait for the rerank API',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getRerankModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return loadModelOptions(this, (m) => m.model_type === 'rerank');
			},
		},
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('bergetAiApi');
		const model = this.getNodeParameter('model', itemIndex) as string;
		const topN = this.getNodeParameter('topN', itemIndex, 3) as number;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			timeout?: number;
		};

		const reranker = new BergetReranker({
			apiKey: credentials.apiKey as string,
			model,
			topN,
			timeoutMs: options.timeout ?? 60000,
		});

		return { response: reranker };
	}
}
