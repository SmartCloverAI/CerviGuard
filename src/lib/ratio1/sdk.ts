import createEdgeSdk, { type EdgeSdk, type EdgeSdkOptions } from "@ratio1/edge-sdk-ts";
import { config } from "../config";

let sdk: EdgeSdk | null = null;

export function getEdgeSdk(): EdgeSdk {
  if (!sdk) {
    const options: EdgeSdkOptions = {};

    if (config.cstoreApiUrl) {
      options.cstoreUrl = config.cstoreApiUrl;
    }
    if (config.r1fsApiUrl) {
      options.r1fsUrl = config.r1fsApiUrl;
    }
    if (config.chainstorePeers.length > 0) {
      options.chainstorePeers = config.chainstorePeers;
    }

    sdk = createEdgeSdk(options);
  }
  return sdk;
}
