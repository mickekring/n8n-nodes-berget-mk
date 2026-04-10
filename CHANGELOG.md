# Changelog

All notable changes to `n8n-nodes-berget-mk` are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org).

## [0.1.1] - 2026-04-10

### Fixed

- **Node icons are now visible in the n8n palette.** The inherited SVG used an `invertFilter` that turned the black logo path white, making it invisible on n8n's light background. Rewrote the SVG as a clean single-path file with a solid emerald (`#10b981`) fill that renders correctly on both light and dark n8n themes.

### Changed

- README marked as **experimental** and explicitly labelled as actively developed, with the expectation of breaking changes before `1.0.0`.

## [0.1.0] - 2026-04-10

### Added

- Initial release of `n8n-nodes-berget-mk` as a single installable npm package.
- Six nodes included: **Chat**, **Agent** (with tool calling), **Embeddings**, **OCR**, **Speech-to-Text**, **Rerank**.
- Shared `Berget AI API` credential using a Bearer API key.
- Dynamic model loading from `https://api.berget.ai/v1/models` for five of the six nodes (OCR uses a fixed model set).

### Origin notes

The initial `0.1.0` codebase was restructured from an earlier seven-package monorepo layout into a single npm package. The monorepo's rerank sub-package was missing a `files: ["dist"]` entry in its `package.json`, which caused it to publish without its compiled output and break installation of the meta-package on any n8n instance. Collapsing to a single package removes that class of failure entirely.

### Known limitations (as of 0.1.0)

- **The `Berget AI Agent` node is a home-built agent loop**, not an n8n AI Agent cluster node. It does not expose modern LLM parameters like `reasoning_effort`, and it does not integrate with n8n's standard Memory / Tool sub-node architecture. This will be addressed in `0.2.0`, where the home-built agent will be removed and replaced with a `Berget AI Chat Model` sub-node that plugs directly into n8n's built-in AI Agent node.
- Node icons were invisible on light-themed n8n instances (fixed in `0.1.1`).
