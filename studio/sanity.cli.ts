import { defineCliConfig } from "sanity/cli";

const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  "";
const dataset =
  process.env.SANITY_STUDIO_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  "production";

if (!projectId) {
  throw new Error(
    "[studio] Missing project ID. Add SANITY_STUDIO_PROJECT_ID=cw1uxyha to studio/.env and restart."
  );
}

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  studioHost: undefined,
   deployment: {
    appId: 'oxwz2yujtdszvketxb7vyqbf',
    autoUpdates: true
  }
});
