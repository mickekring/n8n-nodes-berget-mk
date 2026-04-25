import type {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { bergetRequest, throwBergetError } from './shared';

const showForOcr = {
	displayOptions: {
		show: {
			resource: ['ocr'],
		},
	},
};

const DEFAULT_POLLING_TIMEOUT_SECONDS = 360;
const DEFAULT_POLLING_INTERVAL_SECONDS = 3;

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
		displayName: 'Return Task ID Immediately',
		name: 'ocrReturnTaskIdImmediately',
		type: 'boolean',
		default: false,
		description:
			'Whether to submit the document and return immediately with a taskId instead of waiting for the result. When off (default), the node submits the job and polls internally until the OCR is done, returning the extracted content. When on, the node returns { taskId, resultUrl, status } right away so you can poll the result yourself with an HTTP Request node in a separate step — useful for very slow documents or when you want to decouple submission from retrieval.',
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
				description:
					'OCR engine to use. Not all engines are guaranteed to be available on Berget\'s infrastructure — "easyocr" is the default and most reliable. Try another engine only if easyocr fails for a specific document.',
			},
			{
				displayName: 'Include Images',
				name: 'includeImages',
				type: 'boolean',
				default: false,
				description: 'Whether to include base64-encoded images in the extracted output',
			},
			{
				displayName: 'Polling Timeout (Seconds)',
				name: 'pollingTimeoutSeconds',
				type: 'number',
				typeOptions: { minValue: 10 },
				default: DEFAULT_POLLING_TIMEOUT_SECONDS,
				description:
					"Maximum number of seconds to wait for OCR to complete when Return Task ID Immediately is off. If the job hasn't finished by then, the node throws a timeout error that still includes the taskId so you can retrieve the result later with a separate HTTP Request.",
			},
			{
				displayName: 'Polling Interval (Seconds)',
				name: 'pollingIntervalSeconds',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: DEFAULT_POLLING_INTERVAL_SECONDS,
				description:
					'How many seconds to wait between polls when checking the OCR task status. Berget suggests ~2s, so values of 2–5 are reasonable. The server may override this with a Retry-After header.',
			},
		],
		...showForOcr,
	},
];

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

interface OcrPollStatus {
	status?: string;
	retryAfter?: number;
}

export async function executeOcr(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const credentials = await context.getCredentials('bergetAiApi');
	const apiKey = credentials.apiKey as string;

	const documentType = context.getNodeParameter('ocrDocumentType', itemIndex) as string;
	const returnImmediately = context.getNodeParameter(
		'ocrReturnTaskIdImmediately',
		itemIndex,
		false,
	) as boolean;
	const options = context.getNodeParameter('ocrOptions', itemIndex, {}) as {
		outputFormat?: 'md' | 'json';
		tableMode?: 'accurate' | 'fast';
		ocrMethod?: string;
		includeImages?: boolean;
		pollingTimeoutSeconds?: number;
		pollingIntervalSeconds?: number;
	};

	let documentUrl: string;
	if (documentType === 'url') {
		documentUrl = context.getNodeParameter('ocrDocumentUrl', itemIndex) as string;
	} else {
		const documentData = context.getNodeParameter('ocrDocumentData', itemIndex) as string;
		documentUrl = `data:application/pdf;base64,${documentData}`;
	}

	// Always submit async. Berget's sync /ocr endpoint returns HTTP 500
	// OCR_SERVICE_ERROR on every request as of 2026-04; the async path is
	// the only one that actually works. We wrap polling so the user sees a
	// synchronous result by default.
	const requestBody: IDataObject = {
		document: { url: documentUrl, type: 'document' },
		async: true,
		options: {
			outputFormat: options.outputFormat ?? 'md',
			tableMode: options.tableMode ?? 'accurate',
			ocrMethod: options.ocrMethod ?? 'easyocr',
			includeImages: options.includeImages ?? false,
		},
	};

	const submission = await bergetRequest(apiKey, 'POST', '/ocr', requestBody);
	if (submission.status !== 202 && submission.status !== 200) {
		throwBergetError(context, itemIndex, 'OCR submission', submission.status, submission.data);
	}

	// If Berget ever starts honoring sync again, it'll return a full result at 200.
	// Pass that through directly.
	if (submission.status === 200) {
		const d = submission.data as IDataObject;
		return {
			content: d.content,
			usage: d.usage,
			metadata: d.metadata,
			processing_mode: 'synchronous',
		};
	}

	const submissionData = submission.data as IDataObject;
	const taskId = submissionData.taskId as string | undefined;
	const resultUrl = submissionData.resultUrl as string | undefined;

	if (!taskId) {
		throw new NodeOperationError(
			context.getNode(),
			'Berget AI OCR submission accepted but returned no taskId',
			{ itemIndex },
		);
	}

	if (returnImmediately) {
		return {
			taskId,
			resultUrl,
			status: submissionData.status ?? 'pending',
			processing_mode: 'asynchronous',
			message:
				'Document processing started. Use the taskId with an HTTP Request node against resultUrl to retrieve the extracted content later.',
		};
	}

	// Poll loop.
	const timeoutSeconds = options.pollingTimeoutSeconds ?? DEFAULT_POLLING_TIMEOUT_SECONDS;
	const intervalSeconds = Math.max(options.pollingIntervalSeconds ?? DEFAULT_POLLING_INTERVAL_SECONDS, 1);
	const deadline = Date.now() + timeoutSeconds * 1000;

	while (Date.now() < deadline) {
		const poll = await bergetRequest(apiKey, 'GET', `/ocr/result/${encodeURIComponent(taskId)}`);

		if (poll.status === 200) {
			const d = poll.data as IDataObject;
			return {
				content: d.content,
				usage: d.usage,
				metadata: d.metadata,
				taskId,
				processing_mode: 'asynchronous',
			};
		}

		if (poll.status === 202) {
			// Berget has returned multiple response shapes on 202:
			//   { id, status: 'processing', retryAfter: 2000 }
			//   { error: { message: 'OCR job is still processing', type: 'OCR_JOB_PROCESSING', param: { status, retryAfter } } }
			// If status is 'failed', surface that as an error instead of looping.
			const d = poll.data as OcrPollStatus & { error?: { param?: OcrPollStatus } };
			const observedStatus = d.status ?? d.error?.param?.status;
			if (observedStatus === 'failed') {
				throwBergetError(context, itemIndex, 'OCR', 202, poll.data, ` — taskId: ${taskId}`);
			}
			// Honor the server's retryAfter hint (milliseconds). If shorter than
			// the user-configured floor, stick with the floor. Cap at the
			// remaining deadline so we don't oversleep past the timeout.
			const serverHintMs = d.retryAfter ?? d.error?.param?.retryAfter;
			const minMs = intervalSeconds * 1000;
			const remainingMs = Math.max(0, deadline - Date.now());
			const waitMs = Math.min(Math.max(serverHintMs ?? minMs, minMs), remainingMs);
			await sleep(waitMs);
			continue;
		}

		if (poll.status === 404) {
			throw new NodeOperationError(
				context.getNode(),
				`Berget AI OCR error: task ${taskId} not found (HTTP 404). The task may have been deleted or never existed.`,
				{ itemIndex },
			);
		}

		throwBergetError(context, itemIndex, 'OCR polling', poll.status, poll.data, ` — taskId: ${taskId}`);
	}

	throw new NodeOperationError(
		context.getNode(),
		`Berget AI OCR polling timed out after ${timeoutSeconds}s. The job may still be running on Berget's side. You can retrieve the result later by doing GET /v1/ocr/result/${taskId} with your API key. To avoid this, increase the Polling Timeout option or enable 'Return Task ID Immediately'.`,
		{ itemIndex },
	);
}
