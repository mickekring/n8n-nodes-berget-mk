import type {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { bergetRequest, formatBergetError } from './shared';

const showForChat = {
	displayOptions: {
		show: {
			resource: ['chat'],
		},
	},
};

export const chatProperties: INodeProperties[] = [
	{
		displayName: 'Model',
		name: 'chatModel',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getChatModels' },
		default: '',
		required: true,
		description: 'The Berget AI chat model to use',
		...showForChat,
	},
	{
		displayName: 'Messages',
		name: 'chatMessages',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {
			values: [{ role: 'user', content: '' }],
		},
		options: [
			{
				displayName: 'Values',
				name: 'values',
				values: [
					{
						displayName: 'Role',
						name: 'role',
						type: 'options',
						options: [
							{ name: 'System', value: 'system' },
							{ name: 'User', value: 'user' },
							{ name: 'Assistant', value: 'assistant' },
						],
						default: 'user',
					},
					{
						displayName: 'Content',
						name: 'content',
						type: 'string',
						typeOptions: { rows: 2 },
						default: '',
						description: 'Message content',
					},
				],
			},
		],
		...showForChat,
	},
	{
		displayName: 'Options',
		name: 'chatOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Max Tokens',
				name: 'max_tokens',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 1024,
				description: 'Maximum number of tokens to generate',
			},
			{
				displayName: 'Response Format',
				name: 'response_format',
				type: 'options',
				options: [
					{ name: 'Text', value: 'text' },
					{ name: 'JSON Object', value: 'json_object' },
				],
				default: 'text',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 2 },
				default: 1,
				description: 'Controls randomness. Lower is more deterministic.',
			},
			{
				displayName: 'Top P',
				name: 'top_p',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
				default: 1,
				description: 'Nucleus sampling cutoff',
			},
			{
				displayName: 'User ID',
				name: 'user',
				type: 'string',
				default: '',
				description: 'Unique identifier for tracking and abuse prevention',
			},
		],
		...showForChat,
	},
];

export async function executeChat(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const credentials = await context.getCredentials('bergetAiApi');
	const model = context.getNodeParameter('chatModel', itemIndex) as string;
	const messages = context.getNodeParameter('chatMessages.values', itemIndex, []) as Array<{
		role: string;
		content: string;
	}>;
	const options = context.getNodeParameter('chatOptions', itemIndex, {}) as IDataObject;

	const body: IDataObject = {
		model,
		messages,
		...options,
	};

	if (options.response_format === 'json_object') {
		body.response_format = { type: 'json_object' };
	} else {
		delete body.response_format;
	}

	const { status, data } = await bergetRequest(
		credentials.apiKey as string,
		'POST',
		'/chat/completions',
		body,
	);

	if (status !== 200) {
		throw new NodeOperationError(
			context.getNode(),
			formatBergetError('chat', status, data),
			{ itemIndex },
		);
	}

	return data as IDataObject;
}
