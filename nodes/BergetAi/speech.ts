import axios from 'axios';
import FormData from 'form-data';
import type {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { BERGET_API_BASE_URL } from './shared';

const showForSpeech = {
	displayOptions: {
		show: {
			resource: ['speech'],
		},
	},
};

export const speechProperties: INodeProperties[] = [
	{
		displayName: 'Model',
		name: 'speechModel',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getSpeechModels' },
		default: '',
		required: true,
		description: 'The Berget AI speech-to-text model to use',
		...showForSpeech,
	},
	{
		displayName: 'Audio File',
		name: 'speechFile',
		type: 'string',
		default: '',
		required: true,
		description: 'Path to the audio file or base64-encoded audio data',
		...showForSpeech,
	},
	{
		displayName: 'Options',
		name: 'speechOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				default: 'sv',
				description: 'Language code, e.g. "sv" for Swedish',
			},
			{
				displayName: 'Response Format',
				name: 'response_format',
				type: 'options',
				options: [
					{ name: 'JSON', value: 'json' },
					{ name: 'Text', value: 'text' },
					{ name: 'SRT', value: 'srt' },
					{ name: 'VTT', value: 'vtt' },
				],
				default: 'json',
				description: 'Format for the transcription output',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
				default: 0,
				description: 'Sampling temperature between 0 and 1',
			},
		],
		...showForSpeech,
	},
];

export async function executeSpeech(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const credentials = await context.getCredentials('bergetAiApi');
	const model = context.getNodeParameter('speechModel', itemIndex) as string;
	const file = context.getNodeParameter('speechFile', itemIndex) as string;
	const options = context.getNodeParameter('speechOptions', itemIndex, {}) as IDataObject;

	const formData = new FormData();
	formData.append('model', model);
	formData.append('file', file);
	if (options.language) formData.append('language', options.language as string);
	if (options.response_format) formData.append('response_format', options.response_format as string);
	if (options.temperature !== undefined) {
		formData.append('temperature', String(options.temperature));
	}

	const response = await axios.post(
		`${BERGET_API_BASE_URL}/audio/transcriptions`,
		formData,
		{
			headers: {
				Authorization: `Bearer ${credentials.apiKey as string}`,
				...formData.getHeaders(),
			},
			validateStatus: () => true,
		},
	);

	if (response.status !== 200) {
		const message =
			(response.data as { error?: { message?: string } })?.error?.message ??
			`HTTP ${response.status}`;
		throw new NodeOperationError(context.getNode(), `Berget AI speech error: ${message}`, {
			itemIndex,
		});
	}

	return response.data as IDataObject;
}
