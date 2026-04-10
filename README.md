# n8n-nodes-berget-mk

n8n community nodes for [Berget AI](https://berget.ai), packaged as a single installable module. Maintained by Micke Kring.

Includes six nodes: **Chat**, **Agent** (with tool calling), **Embeddings**, **OCR**, **Speech-to-Text**, and **Rerank**.

> ⚠️ **Experimental — actively developed.** This package is pre-1.0 and the shape of individual nodes may change between minor releases. In particular, the current `Berget AI Agent` node is planned to be removed in `0.2.0` and replaced with a `Berget AI Chat Model` sub-node that plugs into n8n's built-in **AI Agent** node, giving you memory, tools, and `reasoning_effort` for free. Pin a specific version (`n8n-nodes-berget-mk@0.1.1`) in production workflows until `1.0.0`.

## Install

In n8n: **Settings → Community Nodes → Install** and enter:

```text
n8n-nodes-berget-mk
```

Then add a **Berget AI API** credential with your API key from [berget.ai](https://berget.ai).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for what's changed between releases.

## License

MIT. Originally based on the open-source Berget AI n8n nodes.
