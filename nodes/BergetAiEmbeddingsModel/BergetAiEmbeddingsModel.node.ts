import { OpenAIEmbeddings } from '@langchain/openai';
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

const BERGET_API_BASE_URL = 'https://api.berget.ai/v1';

interface BergetModel {
	id: string;
	name?: string;
	model_type?: string;
	owned_by?: string;
}

export class BergetAiEmbeddingsModel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Berget AI Embeddings Model',
		name: 'bergetAiEmbeddingsModel',
		icon: 'file:bergetai.svg',
		group: ['transform'],
		version: 1,
		description:
			'Use a Berget AI embedding model with Vector Store, Question and Answer Chain, or other LangChain nodes',
		defaults: { name: 'Berget AI Embeddings Model' },
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Embeddings'],
			},
		},
		credentials: [{ name: 'bergetAiApi', required: true }],
		inputs: [],
		outputs: [NodeConnectionTypes.AiEmbedding],
		outputNames: ['Embeddings'],
		properties: [
			{
				displayName:
					'This node must be connected to a Vector Store or QA Chain, not executed on its own.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getEmbeddingsModels' },
				default: '',
				required: true,
				description: 'The Berget AI embedding model to use. Fetched live from the Berget API.',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Batch Size',
						name: 'batchSize',
						type: 'number',
						typeOptions: { minValue: 1 },
						default: 512,
						description: 'Number of documents to embed per API request',
					},
					{
						displayName: 'Dimensions',
						name: 'dimensions',
						type: 'number',
						typeOptions: { minValue: 0 },
						default: 0,
						description:
							"⚠️ CURRENTLY BROKEN ON BERGET'S API. Leave at 0 (default) to omit the parameter entirely — this is the only reliable mode as of 2026-04. Setting any positive value causes Berget to return HTTP 503 EMBEDDING_CREATION_ERROR for every request, even when the value matches the model's native dimension (e.g. 1024 for intfloat/multilingual-e5-large-instruct). Berget's OpenAPI spec documents the dimensions parameter but the backend currently rejects it for all embedding models we've tested. The field is kept here so that when Berget fixes their backend, you can set a dimension without a package update. Default behaviour (dimensions=0) returns the model's native vector size.",
					},
					{
						displayName: 'Strip New Lines',
						name: 'stripNewLines',
						type: 'boolean',
						default: true,
						description: 'Whether to strip newlines from input text before embedding',
					},
					{
						displayName: 'Timeout (Ms)',
						name: 'timeout',
						type: 'number',
						typeOptions: { minValue: 1 },
						default: 60000,
						description: 'Maximum time in milliseconds to wait for the embeddings API',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getEmbeddingsModels(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('bergetAiApi');
				const response = await axios.get(`${BERGET_API_BASE_URL}/models`, {
					headers: {
						Authorization: `Bearer ${credentials.apiKey as string}`,
						'Content-Type': 'application/json',
					},
				});
				const models: BergetModel[] = response.data?.data ?? [];
				return models
					.filter((m) => m.model_type === 'embedding')
					.map((m) => ({
						name: m.id,
						value: m.id,
					}))
					.sort((a, b) => a.name.localeCompare(b.name));
			},
		},
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('bergetAiApi');
		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			batchSize?: number;
			dimensions?: number;
			stripNewLines?: boolean;
			timeout?: number;
		};

		// Dimensions is intentionally only passed through when > 0. Berget's
		// backend currently returns HTTP 503 EMBEDDING_CREATION_ERROR for any
		// request that includes the dimensions field (verified 2026-04-11),
		// despite their OpenAPI spec documenting it. The field is kept in the
		// UI so users can opt in once Berget fixes the backend without a
		// package update. See CHANGELOG 0.4.8 for details.
		const embeddings = new OpenAIEmbeddings({
			apiKey: credentials.apiKey as string,
			model: modelName,
			configuration: {
				baseURL: BERGET_API_BASE_URL,
			},
			batchSize: options.batchSize ?? 512,
			stripNewLines: options.stripNewLines ?? true,
			timeout: options.timeout ?? 60000,
			...(options.dimensions && options.dimensions > 0
				? { dimensions: options.dimensions }
				: {}),
		});

		return { response: embeddings };
	}
}
