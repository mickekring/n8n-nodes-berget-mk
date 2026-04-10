import type {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { bergetRequest } from './shared';

const showForOcr = {
	displayOptions: {
		show: {
			resource: ['ocr'],
		},
	},
};

export const ocrProperties: INodeProperties[] = [
	{
		displayName: 'Document Type',
		name: 'ocrDocumentType',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url', description: 'Process a document from a URL' },
			{ name: 'Base64', value: 'base64', description: 'Process a base64-encoded document' },
		],
		default: 'url',
		description: 'How the document is provided',
		...showForOcr,
	},
	{
		displayName: 'Document URL',
		name: 'ocrDocumentUrl',
		type: 'string',
		default: '',
		required: true,
		description:
			"URL of the document to process. Note: Berget AI's server fetches this URL directly, so it must be reachable from Berget's infrastructure (not just from your n8n host). Use public URLs.",
		displayOptions: {
			show: {
				resource: ['ocr'],
				ocrDocumentType: ['url'],
			},
		},
	},
	{
		displayName: 'Document Data',
		name: 'ocrDocumentData',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		description: 'Base64-encoded document data',
		displayOptions: {
			show: {
				resource: ['ocr'],
				ocrDocumentType: ['base64'],
			},
		},
	},
	{
		displayName: 'Processing Mode',
		name: 'ocrAsync',
		type: 'boolean',
		default: false,
		description: 'Whether to process the document asynchronously (recommended for large documents)',
		...showForOcr,
	},
	{
		displayName: 'Options',
		name: 'ocrOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				options: [
					{ name: 'Markdown', value: 'md' },
					{ name: 'JSON', value: 'json' },
				],
				default: 'md',
				description: 'Format for the extracted text',
			},
			{
				displayName: 'Table Mode',
				name: 'tableMode',
				type: 'options',
				options: [
					{ name: 'Accurate', value: 'accurate' },
					{ name: 'Fast', value: 'fast' },
				],
				default: 'accurate',
				description: 'Mode for table extraction',
			},
			{
				displayName: 'OCR Method',
				name: 'ocrMethod',
				type: 'options',
				options: [
					{ name: 'EasyOCR', value: 'easyocr' },
					{ name: 'Tesseract', value: 'tesseract' },
					{ name: 'OCR Mac', value: 'ocrmac' },
					{ name: 'RapidOCR', value: 'rapidocr' },
					{ name: 'TesserOCR', value: 'tesserocr' },
				],
				default: 'easyocr',
				description: 'OCR engine to use',
			},
			{
				displayName: 'Perform OCR',
				name: 'doOcr',
				type: 'boolean',
				default: true,
				description: 'Whether to perform OCR on the document',
			},
			{
				displayName: 'Extract Table Structure',
				name: 'doTableStructure',
				type: 'boolean',
				default: true,
				description: 'Whether to extract table structure',
			},
			{
				displayName: 'Include Images',
				name: 'includeImages',
				type: 'boolean',
				default: false,
				description: 'Whether to include base64-encoded images in the output',
			},
			{
				displayName: 'Input Formats',
				name: 'inputFormat',
				type: 'multiOptions',
				options: [
					{ name: 'PDF', value: 'pdf' },
					{ name: 'HTML', value: 'html' },
					{ name: 'DOCX', value: 'docx' },
					{ name: 'PPTX', value: 'pptx' },
				],
				default: ['pdf'],
				description: 'Input formats to accept',
			},
		],
		...showForOcr,
	},
];

export async function executeOcr(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const credentials = await context.getCredentials('bergetAiApi');
	const documentType = context.getNodeParameter('ocrDocumentType', itemIndex) as string;
	const asyncMode = context.getNodeParameter('ocrAsync', itemIndex) as boolean;
	const options = context.getNodeParameter('ocrOptions', itemIndex, {}) as IDataObject;

	let documentUrl: string;
	if (documentType === 'url') {
		documentUrl = context.getNodeParameter('ocrDocumentUrl', itemIndex) as string;
	} else {
		const documentData = context.getNodeParameter('ocrDocumentData', itemIndex) as string;
		documentUrl = `data:application/pdf;base64,${documentData}`;
	}

	const body: IDataObject = {
		document: { url: documentUrl, type: 'document' },
		async: asyncMode,
		options: {
			outputFormat: options.outputFormat ?? 'md',
			tableMode: options.tableMode ?? 'accurate',
			ocrMethod: options.ocrMethod ?? 'easyocr',
			doOcr: options.doOcr !== false,
			doTableStructure: options.doTableStructure !== false,
			includeImages: options.includeImages ?? false,
			inputFormat: options.inputFormat ?? ['pdf'],
		},
	};

	const { status, data } = await bergetRequest(
		credentials.apiKey as string,
		'POST',
		'/ocr',
		body,
	);

	if (status === 200) {
		const d = data as IDataObject;
		return {
			content: d.content,
			usage: d.usage,
			metadata: d.metadata,
			processing_mode: 'synchronous',
		};
	}

	if (status === 202) {
		const d = data as IDataObject;
		return {
			taskId: d.taskId,
			status: d.status,
			resultUrl: d.resultUrl,
			processing_mode: 'asynchronous',
			message: 'Document processing started. Use the taskId to check status.',
		};
	}

	const message =
		(data as { error?: { message?: string } })?.error?.message ?? `HTTP ${status}`;
	throw new NodeOperationError(context.getNode(), `Berget AI OCR error: ${message}`, {
		itemIndex,
	});
}
