# Berget AI n8n Plugins

A collection of n8n community nodes for using Berget AI's open models in your workflows.

## Available Plugins

### 🤖 Chat/Text Modeller
**Package:** `n8n-nodes-berget-ai-chat`

Supports all Berget AI text/chat models:
- Llama 3.1 8B Instruct
- Llama 3.3 70B Instruct  
- DeepSeek R1 Microsoft AI Finetuned
- Mistral Small 3.1 24B Instruct 2503
- Qwen3 32B
- Devstral Small 2505
- GPT-OSS-120B

### 🔍 Embeddings
**Package:** `n8n-nodes-berget-ai-embeddings`

- Multilingual-E5-large-instruct
- Multilingual-E5-large

### 🎤 Speech-to-Text
**Package:** `n8n-nodes-berget-ai-speech`

- KB-Whisper-Large (Swedish Whisper)

### 📊 Reranking
**Package:** `n8n-nodes-berget-ai-rerank`

- bge-reranker-v2-m3

## Quick Installation

### Via n8n Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Install the plugins you need:
   - `n8n-nodes-berget-ai-chat`
   - `n8n-nodes-berget-ai-embeddings`
   - `n8n-nodes-berget-ai-speech`
   - `n8n-nodes-berget-ai-rerank`

### Via npm

```bash
# Installera alla plugins
npm install n8n-nodes-berget-ai-chat
npm install n8n-nodes-berget-ai-embeddings  
npm install n8n-nodes-berget-ai-speech
npm install n8n-nodes-berget-ai-rerank

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

## Support

- 📧 Support: [kontakt@berget.ai](mailto:kontakt@berget.ai)
- 📖 API Documentation: [api.berget.ai/docs](https://api.berget.ai/docs)
- 🐛 Issues: Report issues in respective plugin repository

## License

MIT License - See LICENSE file in each plugin for details.
