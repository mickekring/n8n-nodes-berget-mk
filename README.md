# @bergetai/n8n-nodes-all

**Complete collection of Berget AI n8n nodes**

One-click installation for all Berget AI n8n community nodes. Get access to AI chat, agents, embeddings, OCR, speech processing, and document reranking - all powered by open source models hosted in Sweden.

## 🚀 Quick Installation

### Via n8n Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Enter: `@bergetai/n8n-nodes-all`
5. Click **Install**

**That's it!** All Berget AI nodes are now available in your n8n instance.

### Via npm

```bash
# Install all nodes at once
npm install @bergetai/n8n-nodes-all
```

### Individual Installation

If you prefer to install specific nodes only:

```bash
npm install @bergetai/n8n-nodes-berget-ai-agent      # AI Agent
npm install @bergetai/n8n-nodes-berget-ai-chat       # Chat/Text
npm install @bergetai/n8n-nodes-berget-ai-embeddings # Embeddings
npm install @bergetai/n8n-nodes-berget-ai-ocr        # OCR
npm install @bergetai/n8n-nodes-berget-ai-speech     # Speech
npm install @bergetai/n8n-nodes-berget-ai-rerank     # Rerank
```

## 🔑 Getting Started

1. **Install**: Use the one-click installation above
2. **Get API Key**: Register at [berget.ai](https://berget.ai) and get your API key
3. **Configure**: Add your Berget AI API key in n8n credentials
4. **Build**: Start creating workflows with AI-powered nodes

## 📦 Available Plugins

### 🤖 Chat/Text Models
**Package:** `@bergetai/n8n-nodes-berget-ai-chat`

Supports all Berget AI text/chat models:
- Llama 3.1 8B Instruct
- Llama 3.3 70B Instruct  
- DeepSeek R1 Microsoft AI Finetuned
- Mistral Small 3.1 24B Instruct 2503
- Qwen3 32B
- Devstral Small 2505
- GPT-OSS-120B
- ...

See a complete list of models here: [berget.ai/models](https://berget.ai/models)

### 🤖 AI Agent
**Package:** `@bergetai/n8n-nodes-berget-ai-agent`

Advanced AI agent with tool calling capabilities:
- Multi-turn conversations
- Tool/function calling
- Custom system prompts
- Iteration control

### 🔍 Embeddings
**Package:** `@bergetai/n8n-nodes-berget-ai-embeddings`

- Multilingual-E5-large-instruct
- Multilingual-E5-large

### 📄 OCR Document Processing
**Package:** `@bergetai/n8n-nodes-berget-ai-ocr`

Extract text from documents:
- PDF, DOCX, PPTX, HTML support
- Multiple OCR engines (EasyOCR, Tesseract, etc.)
- Table extraction
- Async processing for large documents

### 🎤 Speech-to-Text
**Package:** `@bergetai/n8n-nodes-berget-ai-speech`

- KB-Whisper-Large (Swedish Whisper)

### 📊 Reranking
**Package:** `@bergetai/n8n-nodes-berget-ai-rerank`

- bge-reranker-v2-m3


## Example Workflows

### AI Agent with Tools
```
Trigger → Berget AI Agent → HTTP Request (tool) → Response
```

### Document Analysis Pipeline
```
Trigger → Berget AI OCR → Berget AI Chat → Output
```

### Semantic Search System
```
Trigger → Berget AI Embeddings → Vector Store → Berget AI Rerank
```

### Audio Processing Workflow
```
Trigger → Berget AI Speech → Berget AI Chat → Response
```

## Features

- ✅ **One-click installation** - Install all nodes at once
- ✅ **EU-based AI** - Swedish hosting and GDPR compliance
- ✅ **Open source models** - Llama, Mistral, Qwen, and more
- ✅ **Tool calling** - Advanced AI agent capabilities
- ✅ **Document processing** - OCR and text extraction
- ✅ **Speech processing** - Audio transcription
- ✅ **Semantic search** - Embeddings and reranking
- ✅ **Dynamic models** - Always up-to-date model list

## Pricing

See current pricing at [berget.ai/models](https://berget.ai/models)

All prices are in EUR per million tokens, except speech-to-text which is per 1000 minutes.

## Self-Hosted n8n

Berget AI offers self-hosted n8n solutions in our Swedish Kubernetes clusters for organizations that need:

- 🇸🇪 **Swedish hosting** - Keep your data within EU borders
- 🔒 **Data sovereignty** - No data leakage outside EU
- ⚡ **High performance** - Optimized Kubernetes infrastructure
- 🛡️ **Enterprise security** - Full control over your n8n instance

Contact us at [hello@berget.ai](mailto:hello@berget.ai) if you're interested in Swedish hosting solutions.

## Support

- 📧 Support: [hello@berget.ai](mailto:hello@berget.ai)
- 📖 API Documentation: [api.berget.ai/docs](https://api.berget.ai/docs)
- 🐛 Issues: Report issues in the [GitHub repository](https://github.com/bergetai/n8n-plugins)

## Development & Testing

### Quick Test
```bash
# Test node structure without API calls
cd n8n-nodes-berget-ai-chat
npm test

# Test with real API (requires API key)
BERGET_API_KEY=your-key npm test
```

### Local Development
```bash
# Link plugin locally and test in n8n
cd n8n-nodes-berget-ai-chat
npm run test:local

# In another terminal, start n8n
npx n8n start
```

### Docker Testing
```bash
# Quick test with Docker
docker run -it --rm -v $(pwd):/workspace -w /workspace/n8n-nodes-berget-ai-chat node:18 npm test
```

## License

MIT License - See LICENSE file in each plugin for details.
