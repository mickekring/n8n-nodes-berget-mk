# n8n-nodes-berget-ai-ocr

n8n node for Berget AI OCR document processing - extract text from PDFs, images, and documents.

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Enter: `@bergetai/n8n-nodes-berget-ai-ocr`
5. Click **Install**

### Manual Installation

```bash
# In your n8n project
npm install @bergetai/n8n-nodes-berget-ai-ocr
```

## Configuration

1. Add the node to your workflow
2. Configure API settings:
   - **API Key**: Your Berget AI API key
   - **Document Type**: URL or Base64
   - **Document Source**: URL or base64 data
   - **Processing Mode**: Sync or async
   - **Options**: OCR method, output format, etc.

## Features

- ✅ **Multiple Input Types**: URLs and base64 encoded documents
- ✅ **Async Processing**: Handle large documents asynchronously
- ✅ **Multiple OCR Engines**: EasyOCR, Tesseract, RapidOCR, etc.
- ✅ **Table Extraction**: Accurate or fast table processing
- ✅ **Multiple Formats**: Markdown and JSON output
- ✅ **Image Support**: Include images in output
- ✅ **Document Types**: PDF, DOCX, PPTX, HTML support

## Supported Document Types

- **PDF** - Portable Document Format
- **DOCX** - Microsoft Word documents
- **PPTX** - Microsoft PowerPoint presentations
- **HTML** - Web pages and HTML documents
- **Images** - JPG, PNG, TIFF, etc.

## OCR Engines

- **EasyOCR** - Recommended, supports 80+ languages
- **Tesseract** - Classic OCR engine
- **RapidOCR** - Fast processing
- **OCR Mac** - macOS native OCR
- **TesserOCR** - Python wrapper for Tesseract

## Examples

### Basic Document Processing

```javascript
{
  "operation": "process",
  "documentType": "url",
  "documentUrl": "https://example.com/document.pdf",
  "async": false,
  "options": {
    "outputFormat": "md",
    "tableMode": "accurate",
    "ocrMethod": "easyocr"
  }
}
```

### Async Processing for Large Documents

```javascript
{
  "operation": "process",
  "documentType": "url",
  "documentUrl": "https://example.com/large-document.pdf",
  "async": true,
  "options": {
    "outputFormat": "json",
    "tableMode": "fast",
    "ocrMethod": "rapidocr"
  }
}
```

### Base64 Document Processing

```javascript
{
  "operation": "process",
  "documentType": "base64",
  "documentData": "JVBERi0xLjQKJcOkw7zDtsO...",
  "options": {
    "outputFormat": "md",
    "includeImages": true
  }
}
```

## Output Format

### Synchronous Processing

```json
{
  "content": "# Document Title\n\nExtracted text content...",
  "usage": {
    "pages": 5,
    "characters": 2492
  },
  "metadata": {
    "filename": "document.pdf",
    "pageCount": 5,
    "fileType": "application/pdf",
    "processingTime": 7787
  },
  "processing_mode": "synchronous"
}
```

### Asynchronous Processing

```json
{
  "taskId": "d11234-5678-9101-1121",
  "status": "pending",
  "resultUrl": "/v1/ocr/result/d11234-5678-9101-1121",
  "processing_mode": "asynchronous",
  "message": "Document processing started. Use the taskId to check status."
}
```

## Processing Modes

### Synchronous (Default)
- Immediate processing and response
- Best for small to medium documents
- Response includes extracted content directly

### Asynchronous
- Background processing for large documents
- Returns task ID for status checking
- Use separate API calls to get results

## Advanced Options

### Table Extraction
- **Accurate**: Slower but better table structure recognition
- **Fast**: Quicker processing with basic table extraction

### Output Formats
- **Markdown**: Clean, readable text format
- **JSON**: Structured data with metadata

### OCR Options
- **Perform OCR**: Enable/disable text extraction
- **Table Structure**: Extract table layouts
- **Include Images**: Embed images as base64

## Use Cases

- **Document Digitization**: Convert scanned PDFs to text
- **Data Extraction**: Extract structured data from forms
- **Content Analysis**: Process documents for AI analysis
- **Archive Processing**: Digitize historical documents
- **Invoice Processing**: Extract data from invoices
- **Contract Analysis**: Process legal documents

## Pricing

OCR processing is charged per page processed. See current pricing at [berget.ai/models](https://berget.ai/models).

## Testing

```bash
# Test node structure
npm test

# Test with real API
BERGET_API_KEY=your-key npm test

# Link locally for n8n testing
npm run test:local
```

## Support

- 📧 Support: [kontakt@berget.ai](mailto:kontakt@berget.ai)
- 📖 API Documentation: [api.berget.ai/docs](https://api.berget.ai/docs)
- 🐛 Issues: Report issues in the repository

## License

MIT License - See LICENSE file for details.
