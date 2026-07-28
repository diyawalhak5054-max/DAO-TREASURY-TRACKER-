// index.ts
// TypeScript-side types + actor factory for the treasury_backend canister.
import { Actor, HttpAgent, ActorSubclass, Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { idlFactory } from "./treasury_backend.did.js";

export type Role = { Admin: null } | { Treasurer: null } | { Member: null };

export interface Member {
  principal: Principal;
  name: string;
  role: Role;
  addedAt: bigint;
}

export type TransactionStatus =
  | { Pending: null }
  | { Completed: null }
  | { Rejected: null }
  | { Failed: null };

export interface Transaction {
  id: bigint;
  date: bigint;
  from: string;
  to: string;
  amountE8s: bigint;
  memo: bigint;
  status: TransactionStatus;
  blockHeight: [] | [bigint];
  initiatedBy: Principal;
  proposalId: [] | [bigint];
}

export type ProposalStatus =
  | { Open: null }
  | { Approved: null }
  | { Rejected: null }
  | { Executed: null };

export interface Proposal {
  id: bigint;
  to: string;
  amountE8s: bigint;
  memo: bigint;
  description: string;
  createdBy: Principal;
  createdAt: bigint;
  approvals: Principal[];
  rejections: Principal[];
  status: ProposalStatus;
  requiredApprovals: bigint;
}

export interface TreasuryConfig {
  daoName: string;
  multisigThresholdE8s: bigint;
  requiredApprovals: bigint;
  treasurySubaccount: [] | [Uint8Array | number[]];
}

export type ApiError =
  | { NotAuthorized: null }
  | { NotFound: null }
  | { InvalidInput: string }
  | { LedgerError: string };

export interface DashboardCounts {
  memberCount: bigint;
  pendingProposals: bigint;
  totalTransactions: bigint;
  config: TreasuryConfig;
}

export type ResultText = { ok: string } | { err: ApiError };
export type ResultUnit = { ok: null } | { err: ApiError };
export type ResultNat64 = { ok: bigint } | { err: ApiError };

export interface TreasuryBackend {
  init: (daoName: string) => Promise<ResultText>;
  isInitialized: () => Promise<boolean>;

  addMember: (p: Principal, name: string, role: Role) => Promise<ResultUnit>;
  removeMember: (p: Principal) => Promise<ResultUnit>;
  updateMemberRole: (p: Principal, role: Role) => Promise<ResultUnit>;
  getMembers: () => Promise<Member[]>;
  getMyRole: () => Promise<[] | [Role]>;

  updateConfig: (config: TreasuryConfig) => Promise<ResultUnit>;
  getConfig: () => Promise<TreasuryConfig>;

  getBalanceForAccount: (accountHex: string) => Promise<ResultNat64>;
  getDashboardCounts: () => Promise<DashboardCounts>;

  getTransactions: () => Promise<Transaction[]>;
  sendICP: (to: string, amountE8s: bigint, memo: bigint, description: string) => Promise<ResultText>;
  recordDeposit: (amountE8s: bigint, memo: bigint, note: string) => Promise<ResultUnit>;

  getProposals: () => Promise<Proposal[]>;
  approveProposal: (id: bigint) => Promise<ResultText>;
  rejectProposal: (id: bigint) => Promise<ResultText>;

  exportTransactionsCSV: () => Promise<string>;
  importTransactionRecord: (
    date: bigint,
    from: string,
    to: string,
    amountE8s: bigint,
    memo: bigint,
    blockHeight: [] | [bigint]
  ) => Promise<ResultUnit>;
}

export function createTreasuryActor(
  canisterId: string,
  options: { agent?: HttpAgent; identity?: Identity; host?: string } = {}
): ActorSubclass<TreasuryBackend> {
  const agent =
    options.agent ??
    new HttpAgent({
      host: options.host ?? (import.meta.env.DEV ? "http://127.0.0.1:4943" : "https://icp0.io"),
      identity: options.identity,
    });

  // Local replicas use a self-signed root key — fetch it only in dev.
  if (import.meta.env.DEV) {
    agent.fetchRootKey().catch((err) => {
      console.warn("Unable to fetch root key. Is the local replica running?", err);
    });
  }

  return Actor.createActor<TreasuryBackend>(idlFactory, { agent, canisterId });
}
