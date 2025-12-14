import { getEdgeSdk } from "./sdk";

/**
 * Get R1FS client from Edge SDK (matches ratio1-drive pattern)
 */
export function getR1FSClient() {
  return getEdgeSdk().r1fs;
}
