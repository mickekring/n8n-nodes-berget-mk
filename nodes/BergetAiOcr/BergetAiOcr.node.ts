import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import axios from 'axios';

export class BergetAiOcr implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Berget AI OCR',
		name: 'bergetAiOcr',
		icon: 'file:bergetai.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["documentType"]}}',
		description: 'Extract text from documents using Berget AI OCR',
		defaults: {
			name: 'Berget AI OCR',
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
						name: 'Process Document',
						value: 'process',
						description: 'Extract text from document using OCR',
						action: 'Process document with OCR',
					},
				],
				default: 'process',
			},
			{
				displayName: 'Document Type',
				name: 'documentType',
				type: 'options',
				options: [
					{
						name: 'URL',
						value: 'url',
						description: 'Process document from URL',
					},
					{
						name: 'Base64',
						value: 'base64',
						description: 'Process base64 encoded document',
					},
				],
				default: 'url',
				description: 'How to provide the document',
			},
			{
				displayName: 'Document URL',
				name: 'documentUrl',
				type: 'string',
				displayOptions: {
					show: {
						documentType: ['url'],
					},
				},
				default: '',
				description: 'URL to the document to process',
				required: true,
			},
			{
				displayName: 'Document Data',
				name: 'documentData',
				type: 'string',
				displayOptions: {
					show: {
						documentType: ['base64'],
					},
				},
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Base64 encoded document data',
				required: true,
			},
			{
				displayName: 'Processing Mode',
				name: 'async',
				type: 'boolean',
				default: false,
				description: 'Process document asynchronously (recommended for large documents)',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add options',
				default: {},
				options: [
					{
						displayName: 'Output Format',
						name: 'outputFormat',
						type: 'options',
						options: [
							{
								name: 'Markdown',
								value: 'md',
								description: 'Output as Markdown format',
							},
							{
								name: 'JSON',
								value: 'json',
								description: 'Output as structured JSON',
							},
						],
						default: 'md',
						description: 'Format for the extracted text',
					},
					{
						displayName: 'Table Mode',
						name: 'tableMode',
						type: 'options',
						options: [
							{
								name: 'Accurate',
								value: 'accurate',
								description: 'Slower but better table extraction',
							},
							{
								name: 'Fast',
								value: 'fast',
								description: 'Quicker but less precise table extraction',
							},
						],
						default: 'accurate',
						description: 'Mode for table extraction',
					},
					{
						displayName: 'OCR Method',
						name: 'ocrMethod',
						type: 'options',
						options: [
							{
								name: 'EasyOCR',
								value: 'easyocr',
								description: 'EasyOCR engine (recommended)',
							},
							{
								name: 'Tesseract',
								value: 'tesseract',
								description: 'Tesseract OCR engine',
							},
							{
								name: 'OCR Mac',
								value: 'ocrmac',
								description: 'macOS native OCR',
							},
							{
								name: 'RapidOCR',
								value: 'rapidocr',
								description: 'RapidOCR engine',
							},
							{
								name: 'TesserOCR',
								value: 'tesserocr',
								description: 'TesserOCR engine',
							},
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
						description: 'Whether to include images in output (base64 encoded)',
					},
					{
						displayName: 'Input Formats',
						name: 'inputFormat',
						type: 'multiOptions',
						options: [
							{
								name: 'PDF',
								value: 'pdf',
							},
							{
								name: 'HTML',
								value: 'html',
							},
							{
								name: 'DOCX',
								value: 'docx',
							},
							{
								name: 'PPTX',
								value: 'pptx',
							},
						],
						default: ['pdf'],
						description: 'Input formats to process',
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
				const documentType = this.getNodeParameter('documentType', i) as string;
				const async = this.getNodeParameter('async', i) as boolean;
				const options = this.getNodeParameter('options', i, {}) as any;

				if (operation === 'process') {
					let documentUrl: string;
					
					if (documentType === 'url') {
						documentUrl = this.getNodeParameter('documentUrl', i) as string;
					} else {
						const documentData = this.getNodeParameter('documentData', i) as string;
						// Convert base64 to data URL
						documentUrl = `data:application/pdf;base64,${documentData}`;
					}

					const body: any = {
						document: {
							url: documentUrl,
							type: documentType === 'url' ? 'document' : 'document',
						},
						async,
						options: {
							outputFormat: options.outputFormat || 'md',
							tableMode: options.tableMode || 'accurate',
							ocrMethod: options.ocrMethod || 'easyocr',
							doOcr: options.doOcr !== false,
							doTableStructure: options.doTableStructure !== false,
							includeImages: options.includeImages || false,
							inputFormat: options.inputFormat || ['pdf'],
						},
					};

					const response = await axios.post(
						'https://api.berget.ai/v1/ocr',
						body,
						{
							headers: {
								'Authorization': `Bearer ${credentials.apiKey}`,
								'Content-Type': 'application/json',
							},
						}
					);

					if (response.status === 200) {
						// Synchronous processing completed
						returnData.push({
							json: {
								content: response.data.content,
								usage: response.data.usage,
								metadata: response.data.metadata,
								processing_mode: 'synchronous',
							},
							pairedItem: { item: i },
						});
					} else if (response.status === 202) {
						// Asynchronous processing started
						returnData.push({
							json: {
								taskId: response.data.taskId,
								status: response.data.status,
								resultUrl: response.data.resultUrl,
								processing_mode: 'asynchronous',
								message: 'Document processing started. Use the taskId to check status.',
							},
							pairedItem: { item: i },
						});
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`Berget AI OCR API error (${response.status}): ${response.data?.error?.message || response.statusText}`,
							{ itemIndex: i }
						);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error instanceof Error ? error.message : String(error) },
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
