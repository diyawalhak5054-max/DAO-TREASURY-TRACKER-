// env.ts
// Central place that reads canister ids / network from Vite env vars.
// `dfx deploy` writes these into a generated .env at the project root via
// dfx.json's `output_env_file`; copy the values you need into
// src/treasury_frontend/.env (see .env.example) before `npm run build`.

export const DFX_NETWORK = import.meta.env.VITE_DFX_NETWORK ?? "local";

export const TREASURY_BACKEND_CANISTER_ID =
  import.meta.env.VITE_TREASURY_BACKEND_CANISTER_ID ?? "";

export const INTERNET_IDENTITY_CANISTER_ID =
  import.meta.env.VITE_INTERNET_IDENTITY_CANISTER_ID ?? "rdmx6-jaaaa-aaaaa-aaadq-cai";

export const IS_LOCAL = DFX_NETWORK === "local";

export const HOST = IS_LOCAL ? "http://127.0.0.1:4943" : "https://icp0.io";

export const IDENTITY_PROVIDER = IS_LOCAL
  ? `http://${INTERNET_IDENTITY_CANISTER_ID}.localhost:4943`
  : "https://identity.ic0.app";

// Standard mainnet ICP ledger canister id (also aliased locally via dfx.json).
export const ICP_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
