/** Read-only example. Running it requires explicit API configuration and credentials. */
import { Config, Effect } from "effect";
import { Credentials, makeMiaLayer, Parcours, Schemas } from "../src/index.js";

const main = Effect.gen(function* () {
  const platformApiUrl = yield* Config.String("MIA_PLATFORM_API_URL");
  const token = yield* Config.Redacted("MIA_TOKEN");
  const projectId = yield* Config.String("MIA_ENCODED_PROJECT_ID");

  const MiaLive = makeMiaLayer(
    { services: { platform: { baseUrl: platformApiUrl, credential: "mia" } } },
    { mia: Credentials.bearer(token) },
  );

  const project = yield* Parcours.readProject(Schemas.encodedProjectId(projectId)).pipe(Effect.provide(MiaLive));
  // Avoid logging the complete insurance record in a runnable example.
  yield* Effect.logInfo("MIA project read successfully", { hasProjectNumber: Boolean(project.numeroProjet) });
});

Effect.runPromise(main).catch(() => {
  console.error("Read failed. Check configuration and handle the SDK's typed errors in your application.");
  process.exitCode = 1;
});
