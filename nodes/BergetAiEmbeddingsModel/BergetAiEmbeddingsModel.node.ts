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
			stripNewLines?: boolean;
			timeout?: number;
		};

		const embeddings = new OpenAIEmbeddings({
			apiKey: credentials.apiKey as string,
			model: modelName,
			configuration: {
				baseURL: BERGET_API_BASE_URL,
			},
			batchSize: options.batchSize ?? 512,
			stripNewLines: options.stripNewLines ?? true,
			timeout: options.timeout ?? 60000,
		});

		return { response: embeddings };
	}
}
