import { randomBytes } from "crypto";
import { config } from "../core/config.js";

function mockResult(checkpointHash) {
  return {
    mode: "mock",
    status: "MOCK_CONFIRMED",
    transactionHash: `mock_${randomBytes(16).toString("hex")}`,
    checkpointHash,
    network: "LOCAL_MOCK",
    confirmedAt: new Date().toISOString(),
  };
}

export async function storeCheckpointHash(checkpointHash) {
  if (config.blockchainMode !== "mock") {
    throw new Error("Real blockchain mode is not implemented yet");
  }
  return mockResult(checkpointHash);
}

export async function verifyCheckpointHash(checkpoint) {
  if (config.blockchainMode !== "mock") {
    throw new Error("Real blockchain mode is not implemented yet");
  }
  return {
    mode: "mock",
    status: checkpoint?.blockchain?.status || "MOCK_CONFIRMED",
    verified: Boolean(checkpoint?.blockchain?.checkpointHash === checkpoint?.checkpointHash),
    transactionHash: checkpoint?.blockchain?.transactionHash || null,
    checkpointHash: checkpoint?.checkpointHash || null,
    network: "LOCAL_MOCK",
  };
}

export function getBlockchainHealth() {
  return {
    mode: config.blockchainMode,
    status: config.blockchainMode === "mock" ? "MOCK_READY" : "NOT_IMPLEMENTED",
    network: config.blockchainMode === "mock" ? "LOCAL_MOCK" : config.blockchainNetwork,
  };
}