# n8n-nodes-berget-mk

n8n community node for [Berget AI](https://berget.ai), packaged as a single installable module. Maintained by Micke Kring.

Two nodes, two purposes:

- **Berget AI** — a multi-resource action node with five resources: **Chat**, **Embeddings**, **OCR**, **Rerank**, **Speech to Text**. Use this for one-shot calls.
- **Berget AI Chat Model** — a sub-node that plugs into n8n's built-in **AI Agent**, **Basic LLM Chain**, and any other LangChain-based node. Use this to drive an agent with Berget AI as the underlying LLM. Exposes `reasoning_effort` and the full standard LLM parameter set.

> ⚠️ **Experimental — actively developed.** This package is pre-1.0 and the shape of nodes may change between minor releases. Pin a specific version in production workflows until `1.0.0`. See [CHANGELOG.md](CHANGELOG.md) for breaking changes.

## Install

In n8n: **Settings → Community Nodes → Install** and enter:

```text
n8n-nodes-berget-mk
```

Then add a **Berget AI API** credential with your API key from [berget.ai](https://berget.ai).

## Using the Berget AI action node

1. Drop **Berget AI** onto the canvas.
2. Select a **Resource** (Chat, Embeddings, OCR, Rerank, or Speech to Text).
3. Fill in the resource-specific fields (model, input, options).
4. Execute.

## Using Berget with n8n's AI Agent

1. Add n8n's built-in **AI Agent** node.
2. Add a **Berget AI Chat Model** node and connect it to the Agent's **Chat Model** socket.
3. Pick a Berget AI chat model and optionally configure `reasoning_effort` for reasoning-capable models (GPT-OSS, DeepSeek R1).
4. Add Memory and Tool sub-nodes as usual — they work with Berget as the underlying LLM.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for what's changed between releases.

## License

MIT. Originally based on the open-source Berget AI n8n nodes.
