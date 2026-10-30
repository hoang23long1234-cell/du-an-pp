# Local AI upgrade
Scope: truthful local inference, verified artifacts, conversation context, optional loopback Ollama, structured slide output, measured streaming and UI status. Preserve existing files/model weights.
Tasks:
- [x] Write failing tests for validation, history, provider metadata and structured slides.
- [x] Implement local inference service and improve ONNX generation lifecycle.
- [x] Connect Python API, Node streaming and browser model/metrics behavior.
- [ ] Verify focused tests, real inference and browser-visible API status.
No repository detected previously; backups stored in tasks/local-ai-upgrade-backup. No commits or deployment planned.

Verification: 18 focused tests pass; real CPU inference and HTTP status verified. Final browser verification remains incomplete due to Browser timeout. See local-ai-upgrade-result.md.
