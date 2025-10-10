# Berget AI n8n Plugins

A collection of n8n community nodes for using Berget AI's open models in your workflows.

## Available Plugins

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

### 🔍 Embeddings
**Package:** `@bergetai/n8n-nodes-berget-ai-embeddings`

- Multilingual-E5-large-instruct
- Multilingual-E5-large

### 🎤 Speech-to-Text
**Package:** `@bergetai/n8n-nodes-berget-ai-speech`

- KB-Whisper-Large (Swedish Whisper)

### 📊 Reranking
**Package:** `@bergetai/n8n-nodes-berget-ai-rerank`

- bge-reranker-v2-m3

## Quick Installation

### Via n8n Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Install the plugins you need:
   - `@bergetai/n8n-nodes-berget-ai-chat`
   - `@bergetai/n8n-nodes-berget-ai-agent`
   - `@bergetai/n8n-nodes-berget-ai-embeddings`
   - `@bergetai/n8n-nodes-berget-ai-speech`
   - `@bergetai/n8n-nodes-berget-ai-rerank`

### Via npm

```bash
# Install all plugins
npm install @bergetai/n8n-nodes-berget-ai-chat
npm install @bergetai/n8n-nodes-berget-ai-agent
npm install @bergetai/n8n-nodes-berget-ai-embeddings  
npm install @bergetai/n8n-nodes-berget-ai-speech
npm install @bergetai/n8n-nodes-berget-ai-rerank

# Or install individually based on needs
```

## API Key

You need an API key from Berget AI to use these plugins:

1. Register at [Berget AI](https://berget.ai)
2. Get your API key
3. Configure it in n8n credentials

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

- 📧 Support: [kontakt@berget.ai](mailto:hello@berget.ai)
- 📖 API Documentation: [api.berget.ai](https://api.berget.ai)
- 🐛 Issues: Report issues in respective plugin repository

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
