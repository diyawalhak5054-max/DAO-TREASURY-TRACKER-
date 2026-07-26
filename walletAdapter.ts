// walletAdapter.ts
//
// NOTE ON "DELTA WALLET": at the time this project was generated, no public
// SDK, npm package, or integration spec for a "Delta Wallet" could be found.
// To keep the "Internet Identity + Delta Wallet" requirement honest rather
// than guessing at a fake API, this file defines a small WalletAdapter
// interface with:
//   1. `internetIdentityAdapter` — fully working, using @dfinity/auth-client.
//   2. `deltaWalletAdapter` — a stub that looks for a window.ic.deltaWallet
//      injected-provider object (the common pattern used by other ICP
//      wallets like Plug/Stoic/OISY). Replace the TODOs with real calls
//      once Delta publishes their SDK or injected-provider API.
//
// The rest of the app only depends on this interface, so wiring up the real
// Delta Wallet later is a one-file change.

import { AuthClient } from "@dfinity/auth-client";
import { Identity } from "@dfinity/agent";
import { IDENTITY_PROVIDER } from "../lib/env";

export interface WalletAdapter {
  id: "internet-identity" | "delta-wallet";
  label: string;
  isAvailable: () => Promise<boolean>;
  connect: () => Promise<Identity>;
  disconnect: () => Promise<void>;
  getIdentity: () => Identity | null;
}

let authClient: AuthClient | null = null;
async function getAuthClient(): Promise<AuthClient> {
  if (!authClient) {
    authClient = await AuthClient.create();
  }
  return authClient;
}

export const internetIdentityAdapter: WalletAdapter = {
  id: "internet-identity",
  label: "Internet Identity",
  isAvailable: async () => true, // always available — DFINITY-hosted service
  connect: () =>
    new Promise(async (resolve, reject) => {
      const client = await getAuthClient();
      await client.login({
        identityProvider: IDENTITY_PROVIDER,
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1_000_000_000), // 7 days
        onSuccess: () => resolve(client.getIdentity()),
        onError: (err) => reject(err ?? new Error("Internet Identity login failed")),
      });
    }),
  disconnect: async () => {
    const client = await getAuthClient();
    await client.logout();
  },
  getIdentity: () => authClient?.getIdentity() ?? null,
};

// --- Delta Wallet (stub — see note above) -----------------------------------
declare global {
  interface Window {
    ic?: {
      deltaWallet?: {
        requestConnect: (opts?: { whitelist?: string[] }) => Promise<{ principal: string }>;
        disconnect: () => Promise<void>;
        agent?: unknown;
      };
    };
  }
}

export const deltaWalletAdapter: WalletAdapter = {
  id: "delta-wallet",
  label: "Delta Wallet",
  isAvailable: async () => typeof window !== "undefined" && !!window.ic?.deltaWallet,
  connect: async () => {
    if (!window.ic?.deltaWallet) {
      throw new Error(
        "Delta Wallet was not detected in this browser. Install the Delta Wallet extension, or use Internet Identity instead."
      );
    }
    // TODO: once Delta publishes a real SDK, swap this for their documented
    // connect flow and return the Identity/agent it provides.
    await window.ic.deltaWallet.requestConnect({});
    throw new Error(
      "Delta Wallet was detected, but this build doesn't yet know its identity format — update walletAdapter.ts once Delta's SDK is available."
    );
  },
  disconnect: async () => {
    await window.ic?.deltaWallet?.disconnect();
  },
  getIdentity: () => null,
};

export const walletAdapters: WalletAdapter[] = [internetIdentityAdapter, deltaWalletAdapter];
