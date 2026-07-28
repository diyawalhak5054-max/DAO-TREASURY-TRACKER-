// deltaBridge.ts
// Thin, typed wrappers around Delta's injected `window.delta` bridge API.
//
// IMPORTANT SCOPE NOTE: these are calls to Delta's own native functions —
// they work whenever this dapp is running inside the Delta app's webview,
// regardless of which identity (if any) is used to authenticate to the
// treasury_backend canister. They are NOT an alternative IC identity
// provider: nothing documented here constructs a signing `Identity` for
// @dfinity/agent, so canister update calls (sendICP, approveProposal,
// addMember, etc.) still require Internet Identity — see
// src/auth/walletAdapter.ts and its note on that gap.
//
// Every wrapper here falls back to a plain browser equivalent when
// `window.delta` isn't present, so the app still works in a normal browser
// during local development.

export interface DeltaIdentToken {
  accCanisterId: string;
  dAppIdentToken: string;
}

export interface DeltaAdOptions {
  onShow?: () => void;
  onClose?: () => void;
  onError?: (err: unknown) => void;
}

declare global {
  interface Window {
    delta?: {
      authByIdentToken: () => Promise<DeltaIdentToken | null>;
      showConfirm: (message: string, title?: string) => Promise<boolean>;
      showAlert: (message: string, title?: string) => Promise<void>;
      toast: (message: string) => void;
      showQRcode: (data: string, style?: string) => void;
      scanQR: () => Promise<string | null>;
      openUrl: (url: string) => void;
      walletPayment: (
        coinCode: string,
        toAddress: string,
        amount: number,
        memo: string
      ) => Promise<{ success: boolean; txId?: string; error?: string } | null>;
      listAvatarNickname: (dids: string[]) => Promise<Array<{ did: string; avatar?: string; nickname?: string }>>;
      listTransaction: (
        coinCode: string,
        cursor: string | null,
        offset: number,
        limit: number
      ) => Promise<unknown[]>;
      pickImage: () => Promise<string | null>;
      showAd: (adKey: string, options?: DeltaAdOptions) => void;
      translateText: (text: string, targetLang: string) => Promise<string>;
      languageCode: () => Promise<string>;
    };
  }
}

/** True when running inside the Delta app's webview (the bridge object exists). */
export function isDeltaApp(): boolean {
  return typeof window !== "undefined" && !!window.delta;
}

const DELTA_TOKEN_STORAGE_KEY = "identToken";

/** Runs the documented connect handshake and persists the token, per Delta's docs. */
export async function deltaAuthByIdentToken(): Promise<DeltaIdentToken | null> {
  if (!window.delta) return null;
  const res = await window.delta.authByIdentToken();
  if (res == null) return null;
  window.localStorage.setItem(DELTA_TOKEN_STORAGE_KEY, JSON.stringify(res));
  return { accCanisterId: res.accCanisterId, dAppIdentToken: res.dAppIdentToken };
}

export function getStoredDeltaToken(): DeltaIdentToken | null {
  const raw = window.localStorage.getItem(DELTA_TOKEN_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DeltaIdentToken;
  } catch {
    return null;
  }
}

/** Confirm dialog — uses Delta's native confirm sheet when available, else window.confirm. */
export async function deltaConfirm(message: string, title = "Confirm"): Promise<boolean> {
  if (window.delta) return window.delta.showConfirm(message, title);
  return window.confirm(`${title}\n\n${message}`);
}

/** Alert dialog — native alert when available, else window.alert. */
export async function deltaAlert(message: string, title = "Notice"): Promise<void> {
  if (window.delta) {
    await window.delta.showAlert(message, title);
    return;
  }
  window.alert(`${title}\n\n${message}`);
}

/** Lightweight toast — falls back to a transient console message + alert in a plain browser. */
export function deltaToast(message: string): void {
  if (window.delta) {
    window.delta.toast(message);
    return;
  }
  console.info("[toast]", message);
}

export function deltaShowQRCode(data: string, style = "dots"): void {
  window.delta?.showQRcode(data, style);
}

/** Scans a QR code via the native scanner. Returns null outside the Delta app. */
export async function deltaScanQR(): Promise<string | null> {
  if (!window.delta) return null;
  return window.delta.scanQR();
}

/** Opens an external URL via the native browser when available, else a new tab. */
export function deltaOpenUrl(url: string): void {
  if (window.delta) {
    window.delta.openUrl(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Triggers a payment directly from the member's personal Delta Wallet
 * balance — used for the "Deposit to Treasury" flow. This does NOT go
 * through our canister or require an Identity: Delta signs and moves the
 * funds itself. Returns null outside the Delta app.
 */
export async function deltaWalletPayment(
  coinCode: string,
  toAddress: string,
  amount: number,
  memo: string
): Promise<{ success: boolean; txId?: string; error?: string } | null> {
  if (!window.delta) return null;
  return window.delta.walletPayment(coinCode, toAddress, amount, memo);
}

export async function deltaListTransactions(
  coinCode: string,
  cursor: string | null,
  offset: number,
  limit: number
): Promise<unknown[]> {
  if (!window.delta) return [];
  return window.delta.listTransaction(coinCode, cursor, offset, limit);
}
