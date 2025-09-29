# n8n-nodes-berget-ai-chat

n8n node for Berget AI chat/text models (Llama, Mistral, Qwen, GPT-OSS, etc.)

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Enter: `n8n-nodes-berget-ai-chat`
5. Click **Install**

### Manual Installation

```bash
# In your n8n project
npm install n8n-nodes-berget-ai-chat
```

### Local Development

```bash
# Clone this repo
git clone <repo-url>
cd n8n-nodes-berget-ai-chat

# Install dependencies
npm install

# Build project
npm run build

# Link locally for development
npm link
cd /path/to/your/n8n/project
npm link n8n-nodes-berget-ai-chat
```

## Configuration

1. Add the node to your workflow
2. Configure API settings:
   - **API Key**: Your Berget AI API key
   - **Base URL**: `https://api.berget.ai/v1` (default)
   - **Model**: Choose from available models

## Available Models

- Llama 3.1 8B Instruct
- Llama 3.3 70B Instruct  
- DeepSeek R1 Microsoft AI Finetuned
- Mistral Small 3.1 24B Instruct 2503
- Qwen3 32B
- Devstral Small 2505
- Magistral-Small-2506
- GPT-OSS-120B

## Features

- ✅ Chat completion
- ✅ Streaming support
- ✅ Function calling
- ✅ JSON mode
- ✅ Formatted output
- ✅ System and user messages
- ✅ Temperature and other parameters

## Examples

See `examples/` folder for examples of how to use the node in different scenarios.

## Self-Hosted n8n

Interested in running n8n in Sweden without data leaving EU? Berget AI offers self-hosted n8n solutions in our Kubernetes clusters. Contact us at [kontakt@berget.ai](mailto:kontakt@berget.ai) for more information.
