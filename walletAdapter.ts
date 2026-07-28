// walletAdapter.ts
//
// Only Internet Identity is listed here as a WalletAdapter, because a
// WalletAdapter's job is to produce a signing `Identity` that
// @dfinity/agent can use to make authenticated canister calls (sendICP,
// approveProposal, addMember, ...).
//
// Delta's documented API (window.delta.*) is a separate thing: a native
// bridge available whenever this dapp runs inside the Delta app's webview,
// covering things like payments, confirm/alert/toast dialogs, QR
// scan/display, and more — see src/lib/deltaBridge.ts. Nothing in Delta's
// docs so far describes turning its `authByIdentToken()` result into an
// agent Identity, so it can't sign canister calls on the member's behalf
// today. If Delta later documents that step (an agent factory, or a
// delegation-chain format for `dAppIdentToken`), add a `deltaWalletAdapter`
// here alongside Internet Identity — the rest of the app only depends on
// the WalletAdapter interface below, so that would be a small, contained
// change.

import { AuthClient } from "@dfinity/auth-client";
import { Identity } from "@dfinity/agent";
import { IDENTITY_PROVIDER } from "../lib/env";

export interface WalletAdapter {
  id: "internet-identity";
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

export const walletAdapters: WalletAdapter[] = [internetIdentityAdapter];
