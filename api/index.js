import { createRequestHandler } from "@react-router/node";
import * as build from "../build/server/index.js";

export const config = {
  // Vercel accepts "nodejs" for serverless Node runtimes. Using
  // "nodejs20.x" is not supported and causes deployment failures.
  runtime: "nodejs",
};

export default createRequestHandler({
  build,
});
