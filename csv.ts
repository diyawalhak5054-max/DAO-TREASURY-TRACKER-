// csv.ts
// CSV export/import helpers. Export simply downloads the CSV text the
// canister already generates (getConfig/exportTransactionsCSV). Import
// parses a user-supplied CSV client-side, then submits each row to
// importTransactionRecord so historical records land on-chain as
// bookkeeping entries.
import Papa from "papaparse";

export function downloadCsv(filename: string, csvText: string) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ImportedRow {
  date: string;
  from: string;
  to: string;
  amountE8s: string;
  memo: string;
  blockHeight?: string;
}

export function parseCsvFile(file: File): Promise<ImportedRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<ImportedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
}
