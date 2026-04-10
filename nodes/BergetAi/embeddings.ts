import type {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { bergetRequest } from './shared';

const showForEmbeddings = {
	displayOptions: {
		show: {
			resource: ['embeddings'],
		},
	},
};

export const embeddingsProperties: INodeProperties[] = [
	{
		displayName: 'Model',
		name: 'embeddingsModel',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getEmbeddingsModels' },
		default: '',
		required: true,
		description: 'The Berget AI embedding model to use',
		...showForEmbeddings,
	},
	{
		displayName: 'Input Text',
		name: 'embeddingsInput',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		description: 'Text to convert into an embedding vector',
		...showForEmbeddings,
	},
	{
		displayName: 'Options',
		name: 'embeddingsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Encoding Format',
				name: 'encoding_format',
				type: 'options',
				options: [
					{ name: 'Float', value: 'float' },
					{ name: 'Base64', value: 'base64' },
				],
				default: 'float',
				description: 'Format of the returned embedding data',
			},
		],
		...showForEmbeddings,
	},
];

export async function executeEmbeddings(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const credentials = await context.getCredentials('bergetAiApi');
	const model = context.getNodeParameter('embeddingsModel', itemIndex) as string;
	const input = context.getNodeParameter('embeddingsInput', itemIndex) as string;
	const options = context.getNodeParameter('embeddingsOptions', itemIndex, {}) as IDataObject;

	const { status, data } = await bergetRequest(
		credentials.apiKey as string,
		'POST',
		'/embeddings',
		{ model, input, ...options },
	);

	if (status !== 200) {
		const message =
			(data as { error?: { message?: string } })?.error?.message ?? `HTTP ${status}`;
		throw new NodeOperationError(context.getNode(), `Berget AI embeddings error: ${message}`, {
			itemIndex,
		});
	}

	return data as IDataObject;
}
