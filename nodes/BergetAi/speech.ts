import axios from 'axios';
import FormData from 'form-data';
import type {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { BERGET_API_BASE_URL, formatBergetError } from './shared';

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
		displayName: 'Input Data Field Name',
		name: 'speechBinaryProperty',
		type: 'string',
		default: 'data',
		required: true,
		description:
			'Name of the binary property on the incoming item that holds the audio file. Default is "data". When using a Form Trigger, set this to the form field name (e.g. "Audio").',
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
				description: 'Language code, e.g. "sv" for Swedish, "no" for Norwegian, "en" for English',
			},
			{
				displayName: 'Response Format',
				name: 'response_format',
				type: 'options',
				options: [
					{ name: 'JSON', value: 'json' },
					{ name: 'Text', value: 'text' },
					{ name: 'SRT (subtitles)', value: 'srt' },
					{ name: 'VTT (subtitles)', value: 'vtt' },
					{
						name: 'Verbose JSON (segments + speakers)',
						value: 'verbose_json',
					},
				],
				default: 'json',
				description:
					'Format for the transcription output. Use "Verbose JSON" to get segment-level data including speaker labels (when Diarize is on) and word-level timestamps (when Word-Level Alignment is on). Plain JSON returns only the full transcribed text.',
			},
			{
				displayName: 'Diarize (Speaker Identification)',
				name: 'diarize',
				type: 'boolean',
				default: false,
				description:
					'Whether to identify which speaker said what. Adds speaker labels (SPEAKER_00, SPEAKER_01, ...) to each segment. Works best with 2-4 distinct speakers; overlapping speech is a known limitation. When enabled, the Response Format is automatically upgraded to "Verbose JSON" if it was left at JSON or Text, so speaker labels actually appear in the output.',
			},
			{
				displayName: 'Word-Level Alignment',
				name: 'align',
				type: 'boolean',
				default: false,
				description:
					'Whether to add precise per-word timestamps to the transcript. Useful for subtitle generation and word-accurate seeking. Like Diarize, automatically upgrades the Response Format to "Verbose JSON" if it was left at JSON or Text.',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: { rows: 2 },
				default: '',
				description:
					"Optional text to guide the model's transcription style or to seed it with vocabulary, names, or context that improves accuracy on domain-specific audio.",
			},
			{
				displayName: 'Hotwords',
				name: 'hotwords',
				type: 'string',
				default: '',
				description:
					'Comma-separated list of words to boost during transcription. Useful for proper nouns, technical terms, or names the model otherwise mis-hears. Example: "Berget, Stockholm, KB-Whisper, Mistral".',
			},
			{
				displayName: 'Timestamp Granularities',
				name: 'timestamp_granularities',
				type: 'multiOptions',
				options: [
					{ name: 'Word', value: 'word' },
					{ name: 'Segment', value: 'segment' },
				],
				default: [],
				description:
					'Granularities of timestamps to include in the response. Both can be selected. Only effective with Response Format = "Verbose JSON".',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
				default: 0,
				description: 'Sampling temperature between 0 and 1. Lower is more deterministic.',
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
	const binaryPropertyName = context.getNodeParameter(
		'speechBinaryProperty',
		itemIndex,
	) as string;
	const options = context.getNodeParameter('speechOptions', itemIndex, {}) as {
		language?: string;
		response_format?: string;
		diarize?: boolean;
		align?: boolean;
		prompt?: string;
		hotwords?: string;
		timestamp_granularities?: string[];
		temperature?: number;
	};

	const binaryData = context.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const fileBuffer = await context.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	const formData = new FormData();
	formData.append('model', model);
	formData.append('file', fileBuffer, {
		filename: binaryData.fileName ?? 'audio',
		contentType: binaryData.mimeType ?? 'application/octet-stream',
	});
	if (options.language) formData.append('language', options.language);

	// Auto-promote response_format to verbose_json when diarize or align is on
	// and the user left the format at the default 'json' or picked plain 'text'.
	// Both of those formats discard segment-level data, which means the speaker
	// labels and word timestamps the user just asked for would silently
	// disappear. SRT and VTT carry their own segment timing so we leave them
	// alone if explicitly chosen. Verbose JSON we leave alone too (already
	// correct).
	const needsSegmentData = options.diarize || options.align;
	const userPickedFormat = options.response_format;
	const effectiveFormat: string | undefined = needsSegmentData
		? !userPickedFormat || userPickedFormat === 'json' || userPickedFormat === 'text'
			? 'verbose_json'
			: userPickedFormat
		: userPickedFormat;
	if (effectiveFormat) formData.append('response_format', effectiveFormat);

	if (options.diarize) formData.append('diarize', 'true');
	if (options.align) formData.append('align', 'true');
	if (options.prompt) formData.append('prompt', options.prompt);
	if (options.hotwords) formData.append('hotwords', options.hotwords);
	if (options.timestamp_granularities && options.timestamp_granularities.length > 0) {
		// timestamp_granularities is an array. The OpenAI-compatible Whisper
		// convention is to send each value as a separate form field with the
		// same name, e.g. timestamp_granularities[]=word&timestamp_granularities[]=segment.
		// form-data's append handles this when called multiple times with the
		// same key, but we use the [] suffix explicitly for clarity.
		for (const g of options.timestamp_granularities) {
			formData.append('timestamp_granularities[]', g);
		}
	}
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
			maxContentLength: Infinity,
			maxBodyLength: Infinity,
		},
	);

	if (response.status !== 200) {
		throw new NodeOperationError(
			context.getNode(),
			formatBergetError('speech', response.status, response.data),
			{ itemIndex },
		);
	}

	return response.data as IDataObject;
}
