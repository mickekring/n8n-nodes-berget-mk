# n8n-nodes-berget-ai-chat

n8n node för Berget AI:s chat/text modeller (Llama, Mistral, Qwen, GPT-OSS, etc.)

## Installation

### Community Nodes (Rekommenderat)

1. Öppna n8n
2. Gå till **Settings** > **Community Nodes**
3. Klicka på **Install a community node**
4. Ange: `n8n-nodes-berget-ai-chat`
5. Klicka **Install**

### Manuell Installation

```bash
# I ditt n8n projekt
npm install n8n-nodes-berget-ai-chat
```

### Lokal Utveckling

```bash
# Klona detta repo
git clone <repo-url>
cd n8n-nodes-berget-ai-chat

# Installera dependencies
npm install

# Bygg projektet
npm run build

# Länka lokalt för utveckling
npm link
cd /path/to/your/n8n/project
npm link n8n-nodes-berget-ai-chat
```

## Konfiguration

1. Lägg till noden i ditt workflow
2. Konfigurera API-inställningar:
   - **API Key**: Din Berget AI API-nyckel
   - **Base URL**: `https://api.berget.ai/v1` (standard)
   - **Model**: Välj från tillgängliga modeller

## Tillgängliga Modeller

- Llama 3.1 8B Instruct
- Llama 3.3 70B Instruct  
- DeepSeek R1 Microsoft AI Finetuned
- Mistral Small 3.1 24B Instruct 2503
- Qwen3 32B
- Devstral Small 2505
- Magistral-Small-2506
- GPT-OSS-120B

## Funktioner

- ✅ Chat completion
- ✅ Streaming support
- ✅ Function calling
- ✅ JSON mode
- ✅ Formatted output
- ✅ System och user meddelanden
- ✅ Temperature och andra parametrar

## Exempel

Se `examples/` mappen för exempel på hur du använder noden i olika scenarios.
