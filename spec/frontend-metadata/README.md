# Frontend schema evidence

These are extracted syntax facts, not server DTO specifications. The upstream
JavaScript was parsed with Acorn and was never executed. Provenance and exact
UTF-16 offsets are retained with each fact.

| Inventory | Count | File |
| --- | ---: | --- |
| Named code-bearing constants/enums | 99 | `enum-constants.json` |
| Distinct code categories | 80 | same file; generated TypeScript under `src/generated/codes.ts` |
| Initial-value templates | 306 | `ui-templates.json` |
| Named Yup schemas | 425 | `ui-validation-schemas.json.gz` |
| Inline form schemas | 251 | same gzip file |
| Matched form/template associations | 221 | same gzip file |
| Custom Yup methods | 24 | `ui-custom-validation-methods.json` |
| DTO discriminator literals | 7 | `dto-discriminators.json` |

The validation inventory is losslessly compressed because the structured schema
trees are repetitive. Read it without extracting the original application:

```sh
gzip -dc spec/frontend-metadata/ui-validation-schemas.json.gz > /tmp/mia-ui-schemas.json
```

To regenerate from the source files and AST index obtained by the documented
extraction process:

```sh
node scripts/extract-frontend-metadata.cjs
pnpm generate
```

Source expressions and references are retained when static inference is
incomplete. A frontend `required()` rule, empty default, allowed UI option or
conditional branch does not establish server requiredness, all accepted enum
values or access rights.
