# Berget AI n8n Plugins

En samling n8n community nodes för att använda Berget AI:s öppna modeller i dina workflows.

## Tillgängliga Plugins

### 🤖 Chat/Text Modeller
**Package:** `n8n-nodes-berget-ai-chat`

Stöder alla Berget AI:s text/chat modeller:
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

- KB-Whisper-Large (Svenskt Whisper)

### 📊 Reranking
**Package:** `n8n-nodes-berget-ai-rerank`

- bge-reranker-v2-m3

## Snabb Installation

### Via n8n Community Nodes (Rekommenderat)

1. Öppna n8n
2. Gå till **Settings** > **Community Nodes**
3. Klicka **Install a community node**
4. Installera de plugins du behöver:
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

# Eller installera individuellt baserat på behov
```

## API-nyckel

Du behöver en API-nyckel från Berget AI för att använda dessa plugins:

1. Registrera dig på [Berget AI](https://berget.ai)
2. Skaffa din API-nyckel
3. Konfigurera den i n8n credentials

## Prissättning

Se aktuell prissättning på [api.berget.ai/v1/models](https://api.berget.ai/v1/models)

Alla priser är i EUR per miljon tokens, förutom speech-to-text som är per 1000 minuter.

## Support

- 📧 Support: [kontakt@berget.ai](mailto:kontakt@berget.ai)
- 📖 API Dokumentation: [api.berget.ai/docs](https://api.berget.ai/docs)
- 🐛 Issues: Rapportera problem i respektive plugin repository

## Licens

MIT License - Se LICENSE fil i varje plugin för detaljer.
