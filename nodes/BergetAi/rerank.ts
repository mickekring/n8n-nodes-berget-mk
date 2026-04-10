import type {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { bergetRequest } from './shared';

const showForRerank = {
	displayOptions: {
		show: {
			resource: ['rerank'],
		},
	},
};

export const rerankProperties: INodeProperties[] = [
	{
		displayName: 'Model',
		name: 'rerankModel',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getRerankModels' },
		default: '',
		required: true,
		description: 'The Berget AI reranker model to use',
		...showForRerank,
	},
	{
		displayName: 'Query',
		name: 'rerankQuery',
		type: 'string',
		typeOptions: { rows: 2 },
		default: '',
		required: true,
		description: 'Query to rank documents against',
		...showForRerank,
	},
	{
		displayName: 'Documents',
		name: 'rerankDocuments',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {
			values: [{ text: '' }],
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
						typeOptions: { rows: 3 },
						default: '',
						description: 'A single document to rank against the query',
					},
				],
			},
		],
		description: 'Documents to rank',
		...showForRerank,
	},
	{
		displayName: 'Options',
		name: 'rerankOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Top K',
				name: 'top_k',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 10,
				description: 'Number of top-ranked documents to return',
			},
			{
				displayName: 'Return Documents',
				name: 'return_documents',
				type: 'boolean',
				default: true,
				description: 'Whether to include the document text in the response',
			},
		],
		...showForRerank,
	},
];

export async function executeRerank(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const credentials = await context.getCredentials('bergetAiApi');
	const model = context.getNodeParameter('rerankModel', itemIndex) as string;
	const query = context.getNodeParameter('rerankQuery', itemIndex) as string;
	const documents = context.getNodeParameter('rerankDocuments.values', itemIndex, []) as Array<{
		text: string;
	}>;
	const options = context.getNodeParameter('rerankOptions', itemIndex, {}) as IDataObject;

	const { status, data } = await bergetRequest(
		credentials.apiKey as string,
		'POST',
		'/rerank',
		{
			model,
			query,
			documents: documents.map((doc) => doc.text),
			...options,
		},
	);

	if (status !== 200) {
		const message =
			(data as { error?: { message?: string } })?.error?.message ?? `HTTP ${status}`;
		throw new NodeOperationError(context.getNode(), `Berget AI rerank error: ${message}`, {
			itemIndex,
		});
	}

	return data as IDataObject;
}
