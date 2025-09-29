import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import axios from 'axios';

export class BergetAiSpeech implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Berget AI Speech',
		name: 'bergetAiSpeech',
		icon: 'file:bergetai.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["model"]}}',
		description: 'Använd Berget AI:s speech-to-text modeller',
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
						description: 'Transkribera audio till text',
						action: 'Transcribe audio to text',
					},
				],
				default: 'transcribe',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [
					{
						name: 'KB-Whisper-Large',
						value: 'KBLab/kb-whisper-large',
					},
				],
				default: 'KBLab/kb-whisper-large',
				description: 'Speech-to-text modell att använda',
			},
			{
				displayName: 'Audio File',
				name: 'file',
				type: 'string',
				default: '',
				description: 'Path till audiofil eller base64-kodad audio data',
				required: true,
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Lägg till alternativ',
				default: {},
				options: [
					{
						displayName: 'Language',
						name: 'language',
						type: 'string',
						default: 'sv',
						description: 'Språkkod (t.ex. "sv" för svenska)',
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
						description: 'Format för transkriptionen',
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
						description: 'Sampling temperature mellan 0 och 1',
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
