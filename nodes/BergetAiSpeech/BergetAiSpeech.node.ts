import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import axios from 'axios';
import FormData from 'form-data';

export class BergetAiSpeech implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Berget AI Speech',
		name: 'bergetAiSpeech',
		icon: 'file:bergetai.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["model"]}}',
		description: 'Use Berget AI speech-to-text models',
		defaults: {
			name: 'Berget AI Speech',
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
						name: 'Transcribe Audio',
						value: 'transcribe',
						description: 'Transcribe audio to text',
						action: 'Transcribe audio to text',
					},
				],
				default: 'transcribe',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getModels',
				},
				default: 'KBLab/kb-whisper-large',
				description: 'Speech-to-text model to use',
				required: true,
			},
			{
				displayName: 'Audio File',
				name: 'file',
				type: 'string',
				default: '',
				description: 'Path to audio file or base64-encoded audio data',
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
						displayName: 'Language',
						name: 'language',
						type: 'string',
						default: 'sv',
						description: 'Language code (e.g. "sv" for Swedish)',
					},
					{
						displayName: 'Response Format',
						name: 'response_format',
						type: 'options',
						options: [
							{
								name: 'JSON',
								value: 'json',
							},
							{
								name: 'Text',
								value: 'text',
							},
							{
								name: 'SRT',
								value: 'srt',
							},
							{
								name: 'VTT',
								value: 'vtt',
							},
						],
						default: 'json',
						description: 'Format for transcription',
					},
					{
						displayName: 'Temperature',
						name: 'temperature',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 1,
							numberStepSize: 0.1,
						},
						default: 0,
						description: 'Sampling temperature between 0 and 1',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const credentials = await this.getCredentials('bergetAiApi');
					
					const response = await axios.get('https://api.berget.ai/v1/models', {
						headers: {
							'Authorization': `Bearer ${credentials.apiKey}`,
							'Content-Type': 'application/json',
						},
					});

					if (response.status !== 200) {
						throw new Error(`API error: ${response.statusText}`);
					}

					// Filter models that support speech-to-text
					const models = response.data.data || [];
					const speechModels = models.filter((model: any) => {
						// Use API metadata: filter for speech-to-text models
						return model.model_type === 'speech-to-text';
					});

					return speechModels.map((model: any) => ({
						name: model.name || model.id,
						value: model.id,
						description: `${model.name || model.id}${model.owned_by ? ` (${model.owned_by})` : ''}`,
					})).sort((a: any, b: any) => a.name.localeCompare(b.name));

				} catch (error) {
					throw new Error(`Failed to load speech-to-text models from Berget AI API. Please check your API key and network connection. Error: ${error instanceof Error ? error.message : String(error)}`);
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('bergetAiApi');

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const model = this.getNodeParameter('model', i) as string;
				const file = this.getNodeParameter('file', i) as string;
				const options = this.getNodeParameter('options', i, {}) as any;

				if (operation === 'transcribe') {
					const formData = new FormData();
					formData.append('model', model);
					formData.append('file', file);
					
					if (options.language) {
						formData.append('language', options.language);
					}
					if (options.response_format) {
						formData.append('response_format', options.response_format);
					}
					if (options.temperature !== undefined) {
						formData.append('temperature', options.temperature.toString());
					}

					const response = await axios.post(
						'https://api.berget.ai/v1/audio/transcriptions',
						formData,
						{
							headers: {
								'Authorization': `Bearer ${credentials.apiKey}`,
								'Content-Type': 'multipart/form-data',
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
