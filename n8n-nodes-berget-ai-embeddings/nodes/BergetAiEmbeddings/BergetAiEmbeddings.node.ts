import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import axios from 'axios';

export class BergetAiEmbeddings implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Berget AI Embeddings',
		name: 'bergetAiEmbeddings',
		icon: 'file:bergetai.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["model"]}}',
		description: 'Use Berget AI embedding models',
		defaults: {
			name: 'Berget AI Embeddings',
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
						name: 'Create Embeddings',
						value: 'embeddings',
						description: 'Create embeddings from text',
						action: 'Create embeddings from text',
					},
				],
				default: 'embeddings',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [
					{
						name: 'Multilingual-E5-large-instruct',
						value: 'intfloat/multilingual-e5-large-instruct',
					},
					{
						name: 'Multilingual-E5-large',
						value: 'intfloat/multilingual-e5-large',
					},
				],
				default: 'intfloat/multilingual-e5-large-instruct',
				description: 'Embedding model to use',
			},
			{
				displayName: 'Input Text',
				name: 'input',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Text to convert to embeddings',
				required: true,
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add options',
				default: {},
				options: [
					{
						displayName: 'Encoding Format',
						name: 'encoding_format',
						type: 'options',
						options: [
							{
								name: 'Float',
								value: 'float',
							},
							{
								name: 'Base64',
								value: 'base64',
							},
						],
						default: 'float',
						description: 'Format for embedding data',
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
				const input = this.getNodeParameter('input', i) as string;
				const options = this.getNodeParameter('options', i, {}) as any;

				if (operation === 'embeddings') {
					const body: any = {
						model,
						input,
						...options,
					};

					const response = await axios.post(
						'https://api.berget.ai/v1/embeddings',
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
