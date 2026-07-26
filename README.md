# DAO Treasury Tracker (ICP)

An on-chain treasury manager for DAOs on the Internet Computer: live ICP balance, full
transaction history, role-based sending (Admin / Treasurer), multi-signature approval for
large transfers, member management, and CSV import/export. Everything runs in Motoko
canisters — no off-chain APIs.

> **Important note on "Delta Ecosystem" integration:** at the time this project was built,
> no public documentation, SDK, or submission schema for a "Delta DApp Square" or
> "Delta Wallet" could be found. Rather than guess at a fake API, this project:
> - ships `delta.config.json` at the repo root as a best-guess metadata descriptor
>   (name/description/icon/category="DAO Tools") that you should reshape to match
>   Delta's real schema once you have it;
> - implements Internet Identity fully (`src/treasury_frontend/src/auth/walletAdapter.ts`);
> - implements a **Delta Wallet stub adapter** in the same file, behind the same
>   `WalletAdapter` interface as Internet Identity, with clear `TODO`s marking exactly
>   what to replace once Delta publishes a real connect flow (it currently looks for an
>   injected `window.ic.deltaWallet` provider, the common pattern used by other ICP
>   wallets, and throws a clear error explaining it's a placeholder).
>
> Nothing about the ICP/Motoko/React parts of this project depend on that guess — only
> the wallet button and the metadata file need updating once you have Delta's real docs.

## Architecture

```
dao-treasury-tracker/
├── dfx.json                        # canister config (backend + frontend + II + ledger)
├── delta.config.json                # Delta DApp Square metadata (see note above)
├── src/
│   ├── treasury_backend/            # Motoko canister
│   │   ├── main.mo                  # actor: members, transactions, proposals, config
│   │   ├── Types.mo                 # shared data model
│   │   ├── Ledger.mo                 # minimal ICP Ledger actor interface
│   │   ├── Hex.mo                   # hex <-> Blob helper for account identifiers
│   │   └── treasury_backend.did      # candid interface
│   └── treasury_frontend/            # React + TypeScript + Vite + Tailwind
│       ├── src/auth/                 # AuthContext, ThemeContext, wallet adapters
│       ├── src/components/           # Navbar, Sidebar, RoleGuard, badges
│       ├── src/pages/                # Dashboard, Transactions, Send, Proposals, Members, Settings
│       ├── src/lib/                  # actor factory, e8s/ICP formatting, CSV helpers
│       └── src/declarations/         # hand-written candid bindings for treasury_backend
```

### Data model
- **Member** — principal, name, role (`Admin` / `Treasurer` / `Member`)
- **Transaction** — date, from, to, amount (e8s), memo, status, block height
- **Proposal** — multisig approval request (created automatically when a transfer is at/above
  the configured threshold)
- **TreasuryConfig** — DAO name, multisig threshold, required approval count

### How sending works
1. A Treasurer or Admin calls `sendICP`.
2. If the amount is **below** the configured multisig threshold, it transfers immediately via
   the standard ICP Ledger canister and records a `Transaction`.
3. If it's **at or above** the threshold, a `Proposal` is created instead. Once enough
   Treasurers/Admins call `approveProposal`, the transfer executes automatically and a
   `Transaction` is recorded, linked back to the proposal.

### On balances / no external APIs
The dapp never calls an off-chain price API. The dashboard's ICP→USD figure is a manually
entered, locally-persisted estimate (editable inline) so the whole app stays "plug-and-play,
everything on-chain."

## Prerequisites

- [dfx](https://internetcomputer.org/docs/current/developer-docs/getting-started/install) (the IC SDK)
- Node.js 18+
- A cycles wallet (for mainnet deployment) — see the [IC docs](https://internetcomputer.org/docs/current/developer-docs/getting-started/cycles/cycles-faucet) if you don't have one yet

## Local development

```bash
# 1. Start a local replica
dfx start --background

# 2. Deploy Internet Identity, the ICP ledger alias, the backend, and build+deploy the frontend
dfx deploy

# 3. Note the printed treasury_backend canister id, then:
cp src/treasury_frontend/.env.example src/treasury_frontend/.env
# edit .env and set VITE_TREASURY_BACKEND_CANISTER_ID to that id

# 4. Install frontend deps and run the dev server (hot reload against the local replica)
npm run frontend:install
npm run frontend:dev
```

Open the printed local URL, connect with Internet Identity, and on first load go to
**Settings → Initialize** to become the founding Admin.

## Building for production

```bash
npm run frontend:build     # outputs to src/treasury_frontend/dist
dfx deploy                 # rebuilds the backend canister and (re)deploys the asset canister
```

## Deploying to mainnet / Delta DApp Square

1. Make sure you have cycles in a wallet attached to your dfx identity.
2. Deploy to the IC:
   ```bash
   dfx deploy --network ic
   ```
3. Set the frontend's `.env` to the mainnet canister ids (`VITE_DFX_NETWORK=ic`,
   `VITE_TREASURY_BACKEND_CANISTER_ID=<printed id>`), rebuild
   (`npm run frontend:build`), and redeploy the asset canister
   (`dfx deploy treasury_frontend --network ic`).
4. Update `delta.config.json`:
   - fill in `website` with your canister's `https://<canister-id>.icp0.io` URL (or custom domain)
   - replace `icon` with your DAO's branding if you don't want the default Delta-colored mark
   - confirm `category` (`"DAO Tools"`) and tags match Delta's current taxonomy
5. Submit to Delta DApp Square following whatever intake process Delta documents at the time —
   this repo doesn't assume a specific submission API since none was publicly available when
   it was built. If Delta requires a specific manifest shape different from
   `delta.config.json`, rename/reshape this file to match and re-deploy the frontend so it's
   served alongside the app (useful if Delta's crawler expects to fetch it from your canister).
6. Both `treasury_backend` and `treasury_frontend` are upgradeable canisters (the backend
   uses `stable var`s so state survives `dfx deploy` upgrades; the frontend is a standard
   asset canister). Keep your dfx identity/controller access if you plan to upgrade later.

## Roles & permissions

| Action                         | Admin | Treasurer | Member |
|--------------------------------|:-----:|:---------:|:------:|
| View dashboard / history       |  ✅   |    ✅     |   ✅   |
| Send ICP (below threshold)     |  ✅   |    ✅     |   ❌   |
| Approve/reject proposals       |  ✅   |    ✅     |   ❌   |
| Add/remove/change member roles |  ✅   |    ❌     |   ❌   |
| Change multisig settings       |  ✅   |    ❌     |   ❌   |
| Import CSV records             |  ✅   |    ❌     |   ❌   |

## Notes on the ledger interface

`Ledger.mo` declares only the two ICP Ledger methods this dapp calls
(`account_balance`, `transfer`) to keep the canister's own candid surface minimal. The
frontend uses `@dfinity/ledger-icp`'s `AccountIdentifier` helper to derive account ids from
principals (so the canister never has to implement SHA-224/CRC32 itself) — see
`src/treasury_frontend/src/lib/actors.ts`.

## License

MIT
