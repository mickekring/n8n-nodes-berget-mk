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
		description: 'Use Berget AI rerank models',
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
						description: 'Rank documents by relevance',
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
				description: 'Rerank model to use',
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				typeOptions: {
					rows: 2,
				},
				default: '',
				description: 'Query to rank documents against',
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
								description: 'Document text to rank',
							},
						],
					},
				],
				description: 'Documents to rank',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add options',
				default: {},
				options: [
					{
						displayName: 'Top K',
						name: 'top_k',
						type: 'number',
						default: 10,
						description: 'Number of top-ranked documents to return',
					},
					{
						displayName: 'Return Documents',
						name: 'return_documents',
						type: 'boolean',
						default: true,
						description: 'Whether to include document text in response',
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
						json: { error: error instanceof Error ? error.message : String(error) },
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
