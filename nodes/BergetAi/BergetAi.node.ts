import {
	NodeConnectionTypes,
	type IDataObject,
	type IExecuteFunctions,
	type ILoadOptionsFunctions,
	type INodeExecutionData,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { chatProperties, executeChat } from './chat';
import { embeddingsProperties, executeEmbeddings } from './embeddings';
import { executeOcr, ocrProperties } from './ocr';
import { executeRerank, rerankProperties } from './rerank';
import { executeSpeech, speechProperties } from './speech';
import { loadModelOptions } from './shared';

export class BergetAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Berget AI',
		name: 'bergetAi',
		icon: 'file:bergetai.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"]}}',
		description:
			'Use Berget AI for chat completions, embeddings, document OCR, speech-to-text, and document reranking',
		defaults: { name: 'Berget AI' },
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Miscellaneous'],
			},
			alias: ['Berget', 'Berget AI', 'Swedish AI', 'LLM'],
		},
		credentials: [
			{
				name: 'bergetAiApi',
				required: true,
			},
		],
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'chat',
				options: [
					{
						name: 'Chat',
						value: 'chat',
						description: 'Create a chat completion',
					},
					{
						name: 'Embeddings',
						value: 'embeddings',
						description: 'Generate vector embeddings from text',
					},
					{
						name: 'OCR',
						value: 'ocr',
						description: 'Extract text from a document (PDF, DOCX, images)',
					},
					{
						name: 'Rerank',
						value: 'rerank',
						description: 'Rerank documents by relevance to a query',
					},
					{
						name: 'Speech to Text',
						value: 'speech',
						description: 'Transcribe audio to text',
					},
				],
			},
			...chatProperties,
			...embeddingsProperties,
			...ocrProperties,
			...rerankProperties,
			...speechProperties,
		],
	};

	methods = {
		loadOptions: {
			async getChatModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return loadModelOptions(
					this,
					(m) => m.model_type === 'text' || m.model_type === 'ocr',
				);
			},
			async getEmbeddingsModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return loadModelOptions(this, (m) => m.model_type === 'embedding');
			},
			async getRerankModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return loadModelOptions(this, (m) => m.model_type === 'rerank');
			},
			async getSpeechModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return loadModelOptions(this, (m) => m.model_type === 'speech-to-text');
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				let result: IDataObject;

				switch (resource) {
					case 'chat':
						result = await executeChat(this, i);
						break;
					case 'embeddings':
						result = await executeEmbeddings(this, i);
						break;
					case 'ocr':
						result = await executeOcr(this, i);
						break;
					case 'rerank':
						result = await executeRerank(this, i);
						break;
					case 'speech':
						result = await executeSpeech(this, i);
						break;
					default:
						throw new NodeOperationError(
							this.getNode(),
							`Unknown resource: ${resource}`,
							{ itemIndex: i },
						);
				}

				returnData.push({
					json: result,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
