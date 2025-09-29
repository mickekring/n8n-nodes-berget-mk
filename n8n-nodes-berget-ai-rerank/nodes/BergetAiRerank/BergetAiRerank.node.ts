import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import axios from 'axios';

export class BergetAiRerank implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Berget AI Rerank',
		name: 'bergetAiRerank',
		icon: 'file:bergetai.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["model"]}}',
		description: 'Använd Berget AI:s rerank modeller',
		defaults: {
			name: 'Berget AI Rerank',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'bergetAiApi',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL: 'https://api.berget.ai/v1',
		},
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Rerank Documents',
						value: 'rerank',
						description: 'Ranka dokument baserat på relevans',
						action: 'Rerank documents by relevance',
					},
				],
				default: 'rerank',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [
					{
						name: 'bge-reranker-v2-m3',
						value: 'BAAI/bge-reranker-v2-m3',
					},
				],
				default: 'BAAI/bge-reranker-v2-m3',
				description: 'Rerank modell att använda',
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				typeOptions: {
					rows: 2,
				},
				default: '',
				description: 'Sökfråga att ranka dokument mot',
				required: true,
			},
			{
				displayName: 'Documents',
				name: 'documents',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {
					values: [
						{
							text: '',
						},
					],
				},
				options: [
					{
						displayName: 'Values',
						name: 'values',
						values: [
							{
								displayName: 'Document Text',
								name: 'text',
								type: 'string',
								typeOptions: {
									rows: 3,
								},
								default: '',
								description: 'Dokumenttext att ranka',
							},
						],
					},
				],
				description: 'Dokument att ranka',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Lägg till alternativ',
				default: {},
				options: [
					{
						displayName: 'Top K',
						name: 'top_k',
						type: 'number',
						default: 10,
						description: 'Antal top-rankade dokument att returnera',
					},
					{
						displayName: 'Return Documents',
						name: 'return_documents',
						type: 'boolean',
						default: true,
						description: 'Om dokumenttext ska inkluderas i svaret',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('bergetAiApi');

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const model = this.getNodeParameter('model', i) as string;
				const query = this.getNodeParameter('query', i) as string;
				const documents = this.getNodeParameter('documents.values', i, []) as Array<{
					text: string;
				}>;
				const options = this.getNodeParameter('options', i, {}) as any;

				if (operation === 'rerank') {
					const body: any = {
						model,
						query,
						documents: documents.map(doc => doc.text),
						...options,
					};

					const response = await axios.post(
						'https://api.berget.ai/v1/rerank',
						body,
						{
							headers: {
								'Authorization': `Bearer ${credentials.apiKey}`,
								'Content-Type': 'application/json',
							},
						}
					);

					if (response.status !== 200) {
						throw new NodeOperationError(
							this.getNode(),
							`Berget AI API error: ${response.data?.error?.message || response.statusText}`,
							{ itemIndex: i }
						);
					}

					returnData.push({
						json: response.data,
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
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
