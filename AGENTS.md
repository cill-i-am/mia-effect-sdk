# Working on this SDK

- Read `docs/adr/` before changing protocol behavior.
- Use pnpm and Effect 4. Operations return Effects and use the injected
  HttpClient; do not introduce an independently configured fetch/axios client.
- Keep curated services separate from generated discovery metadata. Change the
  specification or generator, then regenerate; do not hand-edit generated files.
- Keep source evidence and validation level visible. UI defaults and validators
  are not an official server schema. Never invent field semantics or requiredness.
- Preserve unknown response fields. Keep encoded project IDs, project numbers,
  quote numbers, internal contract IDs and carrier policy numbers distinct.
- Do not add automatic retries to business actions. Several upstream GET routes
  mutate state, transmit documents or initiate subscription/signature workflows.
- Tests use mocks and synthetic data by default. Do not call an insurance API,
  initiate a signature, transmit a file or bind a policy as a test.
- Never commit credentials, customer records, HAR captures, access tokens or the
  downloaded application bundles. Public source URLs/hashes and extracted
  interface metadata belong in `spec/`.
- Run generation checks, TypeScript checks and tests before proposing a change.
- Use conventional commit messages. Package publication and live integrations
  are separate actions and are not part of an ordinary code change.
