// actors.ts
// Builds the two on-chain actors this dapp talks to: the custom
// treasury_backend canister, and the standard ICP Ledger (via the official
// @dfinity/ledger-icp SDK, so we get correct account-id derivation for free
// instead of reimplementing SHA-224/CRC32 ourselves).
import { HttpAgent, Identity } from "@dfinity/agent";
import { LedgerCanister, AccountIdentifier } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import { createTreasuryActor, TreasuryBackend } from "../declarations/treasury_backend";
import { ActorSubclass } from "@dfinity/agent";
import { HOST, ICP_LEDGER_CANISTER_ID, TREASURY_BACKEND_CANISTER_ID, IS_LOCAL } from "./env";

export async function buildAgent(identity?: Identity): Promise<HttpAgent> {
  const agent = new HttpAgent({ host: HOST, identity });
  if (IS_LOCAL) {
    // Local replicas use a dev root key that isn't trusted by default.
    await agent.fetchRootKey();
  }
  return agent;
}

export async function buildTreasuryActor(identity?: Identity): Promise<ActorSubclass<TreasuryBackend>> {
  const agent = await buildAgent(identity);
  if (!TREASURY_BACKEND_CANISTER_ID) {
    throw new Error(
      "VITE_TREASURY_BACKEND_CANISTER_ID is not set. Run `dfx deploy` and copy the canister id into your .env file."
    );
  }
  return createTreasuryActor(TREASURY_BACKEND_CANISTER_ID, { agent });
}

export async function buildLedger(identity?: Identity): Promise<LedgerCanister> {
  const agent = await buildAgent(identity);
  return LedgerCanister.create({
    agent,
    canisterId: Principal.fromText(ICP_LEDGER_CANISTER_ID),
  });
}

/** Derives the hex account identifier for the treasury canister itself (its default subaccount). */
export function treasuryAccountHex(): string {
  if (!TREASURY_BACKEND_CANISTER_ID) return "";
  const accountId = AccountIdentifier.fromPrincipal({
    principal: Principal.fromText(TREASURY_BACKEND_CANISTER_ID),
  });
  return accountId.toHex();
}

/** Derives the hex account identifier for an arbitrary destination principal (used by the Send form). */
export function accountHexForPrincipal(principalText: string): string {
  const accountId = AccountIdentifier.fromPrincipal({
    principal: Principal.fromText(principalText),
  });
  return accountId.toHex();
}
