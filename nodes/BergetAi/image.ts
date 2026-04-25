import type {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { bergetRequest, throwBergetError } from './shared';

const showForImage = {
	displayOptions: {
		show: {
			resource: ['image'],
		},
	},
};

type ImageDetail = 'auto' | 'low' | 'high';

export const imageProperties: INodeProperties[] = [
	{
		displayName: 'Model',
		name: 'imageModel',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getVisionModels' },
		default: '',
		required: true,
		description:
			'The Berget AI vision-capable chat model to use. Only models with capabilities.vision === true are shown.',
		...showForImage,
	},
	{
		displayName: 'Text Input',
		name: 'imageText',
		type: 'string',
		typeOptions: { rows: 3 },
		default: "What's in this image?",
		description: 'The prompt sent alongside the image (e.g. "Describe the scene" or "Extract any visible text")',
		...showForImage,
	},
	{
		displayName: 'Input Type',
		name: 'imageInputType',
		type: 'options',
		options: [
			{
				name: 'Binary File',
				value: 'binary',
				description: 'Read an image from the incoming item\'s binary data (most n8n workflows)',
			},
			{
				name: 'Image URL',
				value: 'url',
				description: 'Fetch an image from a public URL',
			},
		],
		default: 'binary',
		description: 'How the image is provided',
		...showForImage,
	},
	{
		displayName: 'Input Data Field Name',
		name: 'imageBinaryProperty',
		type: 'string',
		default: 'data',
		required: true,
		description:
			'Name of the binary property on the incoming item that holds the image. Default is "data". When using a Form Trigger, set this to the form field name (e.g. "Image").',
		displayOptions: {
			show: {
				resource: ['image'],
				imageInputType: ['binary'],
			},
		},
	},
	{
		displayName: 'Image URL',
		name: 'imageUrl',
		type: 'string',
		default: '',
		required: true,
		description: 'Public URL of the image to analyze. Must be reachable from Berget AI\'s servers.',
		displayOptions: {
			show: {
				resource: ['image'],
				imageInputType: ['url'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'imageOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Detail Level',
				name: 'detail',
				type: 'options',
				options: [
					{ name: 'Auto', value: 'auto' },
					{ name: 'Low', value: 'low' },
					{ name: 'High', value: 'high' },
				],
				default: 'auto',
				description:
					"How carefully the model should analyze the image. \"High\" gives more detailed analysis but costs more tokens; \"low\" is cheaper and faster for simple tasks.",
			},
			{
				displayName: 'Max Tokens',
				name: 'max_tokens',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 1024,
				description: 'Maximum number of tokens to generate in the response',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 2 },
				default: 0.7,
				description: 'Controls randomness. Lower is more deterministic.',
			},
		],
		...showForImage,
	},
];

export async function executeImage(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const credentials = await context.getCredentials('bergetAiApi');
	const model = context.getNodeParameter('imageModel', itemIndex) as string;
	const text = context.getNodeParameter('imageText', itemIndex) as string;
	const inputType = context.getNodeParameter('imageInputType', itemIndex) as 'binary' | 'url';
	const options = context.getNodeParameter('imageOptions', itemIndex, {}) as {
		detail?: ImageDetail;
		max_tokens?: number;
		temperature?: number;
	};

	let imageUrlValue: string;
	if (inputType === 'binary') {
		const binaryPropertyName = context.getNodeParameter(
			'imageBinaryProperty',
			itemIndex,
		) as string;
		const binaryData = context.helpers.assertBinaryData(itemIndex, binaryPropertyName);
		const buffer = await context.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
		const mimeType = binaryData.mimeType ?? 'image/png';
		imageUrlValue = `data:${mimeType};base64,${buffer.toString('base64')}`;
	} else {
		imageUrlValue = context.getNodeParameter('imageUrl', itemIndex) as string;
		if (!imageUrlValue) {
			throw new NodeOperationError(
				context.getNode(),
				'Berget AI image: Image URL is empty',
				{ itemIndex },
			);
		}
	}

	const userMessage = {
		role: 'user',
		content: [
			{ type: 'text', text },
			{
				type: 'image_url',
				image_url: {
					url: imageUrlValue,
					detail: options.detail ?? 'auto',
				},
			},
		],
	};

	const body: IDataObject = {
		model,
		messages: [userMessage],
	};
	if (options.max_tokens !== undefined) body.max_tokens = options.max_tokens;
	if (options.temperature !== undefined) body.temperature = options.temperature;

	const { status, data } = await bergetRequest(
		credentials.apiKey as string,
		'POST',
		'/chat/completions',
		body,
	);

	if (status !== 200) {
		throwBergetError(context, itemIndex, 'image analysis', status, data);
	}

	return data as IDataObject;
}
