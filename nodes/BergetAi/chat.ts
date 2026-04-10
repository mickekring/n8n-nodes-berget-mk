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
					{ name: 'JSON Schema', value: 'json_schema' },
				],
				default: 'text',
				description:
					'Force the model to return a specific response format. "JSON Object" tells the model to return any valid JSON. "JSON Schema" enforces a specific JSON schema you provide — set the schema with the JSON Schema fields below.',
			},
			{
				displayName: 'JSON Schema Name',
				name: 'json_schema_name',
				type: 'string',
				default: 'response',
				description:
					'A short name for the schema, required by the API when Response Format is set to JSON Schema. Use something like "classification" or "extraction".',
				displayOptions: {
					show: {
						'/chatOptions.response_format': ['json_schema'],
					},
				},
			},
			{
				displayName: 'JSON Schema',
				name: 'json_schema',
				type: 'json',
				default:
					'{\n  "type": "object",\n  "properties": {\n    "category": { "type": "string" },\n    "confidence": { "type": "number" }\n  },\n  "required": ["category", "confidence"]\n}',
				description:
					'A JSON Schema the model must conform to. When set, the model is forced to return output matching this schema exactly (strict mode). Useful for classification, extraction, and any workflow that needs parseable structured output.',
				displayOptions: {
					show: {
						'/chatOptions.response_format': ['json_schema'],
					},
				},
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
	const options = context.getNodeParameter('chatOptions', itemIndex, {}) as IDataObject & {
		response_format?: 'text' | 'json_object' | 'json_schema';
		json_schema?: string | IDataObject;
		json_schema_name?: string;
	};

	const {
		response_format: responseFormat,
		json_schema: jsonSchema,
		json_schema_name: jsonSchemaName,
		...passthroughOptions
	} = options;

	const body: IDataObject = {
		model,
		messages,
		...passthroughOptions,
	};

	if (responseFormat === 'json_object') {
		body.response_format = { type: 'json_object' };
	} else if (responseFormat === 'json_schema') {
		let parsedSchema: unknown;
		if (typeof jsonSchema === 'string') {
			try {
				parsedSchema = JSON.parse(jsonSchema);
			} catch (err) {
				throw new NodeOperationError(
					context.getNode(),
					`Berget AI chat: JSON Schema option is not valid JSON. ${(err as Error).message}`,
					{ itemIndex },
				);
			}
		} else {
			parsedSchema = jsonSchema;
		}
		if (!parsedSchema || typeof parsedSchema !== 'object') {
			throw new NodeOperationError(
				context.getNode(),
				'Berget AI chat: JSON Schema option is empty or not an object',
				{ itemIndex },
			);
		}
		body.response_format = {
			type: 'json_schema',
			json_schema: {
				name: (jsonSchemaName ?? 'response').trim() || 'response',
				schema: parsedSchema,
				strict: true,
			},
		};
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
