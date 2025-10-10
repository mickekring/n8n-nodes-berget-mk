# n8n-nodes-berget-ai-agent

n8n node for Berget AI Agent with tool calling capabilities - similar to OpenAI Agent node.

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Enter: `@bergetai/n8n-nodes-berget-ai-agent`
5. Click **Install**

### Manual Installation

```bash
# In your n8n project
npm install @bergetai/n8n-nodes-berget-ai-agent
```

### Local Development

```bash
# Clone this repo
git clone <repo-url>
cd n8n-nodes-berget-ai-agent

# Install dependencies
npm install

# Build project
npm run build

# Link locally for development
npm link
cd /path/to/your/n8n/project
npm link @bergetai/n8n-nodes-berget-ai-agent
```

## Configuration

1. Add the node to your workflow
2. Configure API settings:
   - **API Key**: Your Berget AI API key
   - **Base URL**: `https://api.berget.ai/v1` (default)
   - **Model**: Choose from available models
   - **System Prompt**: Define the agent's behavior
   - **User Message**: The task or question for the agent
   - **Tools**: Define tools the agent can use

## Available Models

- Llama 3.1 8B Instruct
- Llama 3.3 70B Instruct (recommended for agents)
- DeepSeek R1 Microsoft AI Finetuned
- Mistral Small 3.1 24B Instruct 2503
- Qwen3 32B
- Devstral Small 2505
- GPT-OSS-120B

## Features

- ✅ **Tool Calling**: Define custom tools with JSON Schema
- ✅ **Multi-turn Conversations**: Agent can make multiple tool calls
- ✅ **Flexible Tool Choice**: Auto, required, or none
- ✅ **Iteration Control**: Set maximum number of agent iterations
- ✅ **System Prompts**: Customize agent behavior
- ✅ **Temperature Control**: Adjust response randomness
- ✅ **Token Limits**: Control response length

## How It Works

The agent node follows this workflow:

1. **Initial Request**: User provides a task/question and available tools
2. **Agent Processing**: Model analyzes the task and decides if tools are needed
3. **Tool Calling**: If needed, the agent generates tool calls with parameters
4. **Iteration**: The agent can make multiple tool calls in sequence
5. **Final Response**: Agent provides the final answer

## Tool Definition

Tools are defined using JSON Schema format:

```json
{
  "type": "object",
  "properties": {
    "location": {
      "type": "string",
      "description": "The city and country"
    },
    "units": {
      "type": "string",
      "enum": ["celsius", "fahrenheit"],
      "description": "Temperature units"
    }
  },
  "required": ["location"]
}
```

## Examples

### Basic Agent with Weather Tool

```javascript
{
  "operation": "agent",
  "model": "meta-llama/Llama-3.3-70B-Instruct",
  "systemPrompt": "You are a helpful assistant with access to weather data.",
  "userMessage": "What's the weather in Stockholm?",
  "tools": [
    {
      "name": "get_weather",
      "description": "Get current weather for a location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "City and country"
          }
        },
        "required": ["location"]
      }
    }
  ],
  "options": {
    "temperature": 0.7,
    "max_iterations": 5,
    "tool_choice": "auto"
  }
}
```

### Agent with Multiple Tools

```javascript
{
  "operation": "agent",
  "model": "meta-llama/Llama-3.3-70B-Instruct",
  "systemPrompt": "You are a research assistant.",
  "userMessage": "Find information about AI and save it.",
  "tools": [
    {
      "name": "search_web",
      "description": "Search the web for information",
      "parameters": {
        "type": "object",
        "properties": {
          "query": { "type": "string" }
        },
        "required": ["query"]
      }
    },
    {
      "name": "save_document",
      "description": "Save text to a document",
      "parameters": {
        "type": "object",
        "properties": {
          "content": { "type": "string" },
          "filename": { "type": "string" }
        },
        "required": ["content", "filename"]
      }
    }
  ]
}
```

## Output Format

The agent node returns:

```json
{
  "response": "Final agent response text",
  "tool_calls": [
    {
      "id": "call_abc123",
      "name": "get_weather",
      "arguments": "{\"location\": \"Stockholm, Sweden\"}",
      "iteration": 1
    }
  ],
  "iterations": 2,
  "messages": [...],
  "model": "meta-llama/Llama-3.3-70B-Instruct"
}
```

## Testing

### Quick Test
```bash
# Test node structure
npm test

# Test with real API
BERGET_API_KEY=your-key npm test

# Link locally for n8n testing
npm run test:local
```

## Comparison with OpenAI Agent

This node provides similar functionality to OpenAI's Agent node:

| Feature | Berget AI Agent | OpenAI Agent |
|---------|----------------|--------------|
| Tool Calling | ✅ | ✅ |
| Multi-turn | ✅ | ✅ |
| Custom Tools | ✅ | ✅ |
| System Prompts | ✅ | ✅ |
| Open Models | ✅ | ❌ |
| EU Hosting | ✅ | ❌ |

## Pricing

See current pricing at [berget.ai/models](https://berget.ai/models)

All prices are in EUR per million tokens.

## Support

- 📧 Support: [kontakt@berget.ai](mailto:kontakt@berget.ai)
- 📖 API Documentation: [api.berget.ai/docs](https://api.berget.ai/docs)
- 🐛 Issues: Report issues in the repository

## License

MIT License - See LICENSE file for details.
