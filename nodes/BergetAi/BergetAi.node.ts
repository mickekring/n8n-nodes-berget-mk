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
import { executeImage, imageProperties } from './image';
// OCR temporarily disabled — see the block comment below the BergetAi class
// header for the re-enable procedure.
// import { executeOcr, ocrProperties } from './ocr';
import { executeRerank, rerankProperties } from './rerank';
import { executeSpeech, speechProperties } from './speech';
import { loadModelOptions } from './shared';

// ---------------------------------------------------------------------------
// OCR is temporarily hidden from the UI (since v0.4.4, 2026-04-10).
//
// Why: Berget AI removed OCR from their public pricing/models page, and the
// sync /v1/ocr endpoint returns HTTP 500 OCR_SERVICE_ERROR on every request.
// Async submissions are accepted but jobs sit in 'processing' indefinitely.
// The endpoint looks like an orphaned API surface whose backend has been
// retired. Rather than confuse users with a broken option, we hide it.
//
// The full implementation is intact at nodes/BergetAi/ocr.ts and will
// continue to compile and ship in the tarball (as dead code). If Berget
// brings OCR back, or someone confirms it works again, re-enabling is four
// uncomments in this file:
//
//   1. The `import { executeOcr, ocrProperties } from './ocr';` line above.
//   2. The OCR entry in the `resource` dropdown options array.
//   3. The `...ocrProperties` spread in the properties array.
//   4. The `case 'ocr':` branch in the execute() switch.
//
// All four are marked with "OCR:" comments below. No code needs to change.
// ---------------------------------------------------------------------------

export class BergetAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Berget AI',
		name: 'bergetAi',
		icon: 'file:bergetai.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"]}}',
		description:
			'Use Berget AI for chat completions, image analysis, speech-to-text, and document reranking',
		defaults: { name: 'Berget AI' },
		usableAsTool: true,
		codex: {
			alias: ['Berget', 'Berget AI', 'Swedish AI', 'LLM', 'KB-Whisper'],
			categories: ['AI'],
			subcategories: {
				AI: ['Agents', 'Miscellaneous', 'Root Nodes'],
			},
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
						name: 'Image Analysis',
						value: 'image',
						description: 'Ask a vision-capable model about an image',
					},
					// OCR: uncomment this block to re-enable the OCR resource.
					// {
					// 	name: 'OCR',
					// 	value: 'ocr',
					// 	description: 'Extract text from a document (PDF, DOCX, images)',
					// },
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
			...imageProperties,
			// OCR: uncomment to re-enable the OCR resource properties.
			// ...ocrProperties,
			...rerankProperties,
			...speechProperties,
		],
	};

	methods = {
		loadOptions: {
			async getChatModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return loadModelOptions(this, (m) => m.model_type === 'text');
			},
			async getVisionModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return loadModelOptions(
					this,
					(m) => m.model_type === 'text' && m.capabilities?.vision === true,
				);
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
					case 'image':
						result = await executeImage(this, i);
						break;
					// OCR: uncomment to re-enable the OCR execute branch.
					// case 'ocr':
					// 	result = await executeOcr(this, i);
					// 	break;
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
