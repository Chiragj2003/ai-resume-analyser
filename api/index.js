import { createRequestHandler } from "@react-router/node";
import * as build from "../build/server/index.js";

export const config = {
  runtime: "nodejs20.x",
};

export default createRequestHandler({
  build,
});
