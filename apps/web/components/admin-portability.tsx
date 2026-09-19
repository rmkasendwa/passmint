"use client";

import { Download, Upload } from "lucide-react";
import { useState } from "react";
import { api, type ImportReport } from "../api";
import { useAppContext } from "./app-provider";

const input = "min-h-11 w-full rounded-md border border-border bg-surface-elevated px-3 text-sm";
const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-(--button-bg) px-4 font-semibold text-(--button-text) disabled:opacity-50";

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const value = (error as { message: unknown }).message;
    return Array.isArray(value) ? value.join(" ") : String(value);
  }
  return "The operation could not be completed.";
}

export function AdminPortability() {
  const { session } = useAppContext();
  const [ownerId, setOwnerId] = useState("");
  const [source, setSource] = useState("");
  const [archive, setArchive] = useState<Record<string, unknown> | null>(null);
  const [fileName, setFileName] = useState("");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  if (!session) return null;

  async function download() {
    setBusy(true); setStatus("");
    try {
      const data = await api.exportEvents({ ...(ownerId.trim() && { ownerId: ownerId.trim() }), ...(source.trim() && { sourceEnvironment: source.trim() }) }, session!.token);
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url; link.download = `passmint-events-${new Date().toISOString().slice(0, 10)}.json`; link.click();
      URL.revokeObjectURL(url); setStatus("Export prepared and downloaded.");
    } catch (error) { setStatus(errorMessage(error)); } finally { setBusy(false); }
  }

  async function select(file?: File) {
    setArchive(null); setReport(null); setFileName(file?.name ?? ""); setStatus("");
    if (!file) return;
    try {
      const value = JSON.parse(await file.text());
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Choose a valid Passmint JSON archive.");
      setArchive(value);
    } catch (error) { setStatus(errorMessage(error)); }
  }

  async function run(dryRun: boolean) {
    if (!archive) return;
    if (!dryRun && (!report?.dryRun || report.counts.failed)) return setStatus("Complete a successful dry run before importing.");
    setBusy(true); setStatus("");
    try {
      const next = await api.importEvents({ archive, dryRun, onDuplicate: "skip", ...(ownerId.trim() && { targetOwnerId: ownerId.trim() }) }, session!.token);
      setReport(next); setStatus(next.summary);
    } catch (error) { setStatus(errorMessage(error)); } finally { setBusy(false); }
  }

  return <div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10">
    <header className="mb-8 border-b border-border pb-6"><p className="mb-2 text-xs font-semibold uppercase text-accent">Platform administration</p><h1 className="text-3xl font-bold">Event portability</h1><p className="mt-2 max-w-2xl text-text-muted">Move event definitions between deployments through a reviewed export and import workflow.</p></header>
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="border-t-2 border-accent pt-5"><Download className="mb-3 text-accent"/><h2 className="text-xl font-semibold">Export events</h2><p className="mb-5 mt-2 text-sm text-text-muted">Leave owner blank to include every event available to this administrator.</p><div className="grid gap-4"><label className="grid gap-2 text-sm font-medium">Owner ID<input className={input} value={ownerId} onChange={e => setOwnerId(e.target.value)} placeholder="Optional account ID" /></label><label className="grid gap-2 text-sm font-medium">Source environment<input className={input} value={source} onChange={e => setSource(e.target.value)} placeholder="production-east" /></label><button className={button} disabled={busy} onClick={download}><Download size={18}/>Download archive</button></div></section>
      <section className="border-t-2 border-accent pt-5"><Upload className="mb-3 text-accent"/><h2 className="text-xl font-semibold">Import events</h2><p className="mb-5 mt-2 text-sm text-text-muted">Selecting a file does not start an import. Validate it before applying changes.</p><div className="grid gap-4"><label className="grid gap-2 text-sm font-medium">Passmint archive<input className={input} type="file" accept="application/json,.json" onChange={e => select(e.target.files?.[0])}/></label>{fileName && <p className="text-sm text-text-muted">Selected: {fileName}</p>}<div className="flex flex-wrap gap-3"><button className={button} disabled={busy || !archive} onClick={() => run(true)}>Validate archive</button><button className={button} disabled={busy || !archive || !report?.dryRun || Boolean(report.counts.failed)} onClick={() => run(false)}>Start import</button></div></div></section>
    </div>
    {status && <p className="mt-8 rounded-md bg-accent-soft p-4 text-sm" role="status">{status}</p>}
    {report && <section className="mt-6 border-t border-border pt-5"><h2 className="mb-3 text-lg font-semibold">Latest report</h2><dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">{Object.entries(report.counts).map(([key,value]) => <div key={key}><dt className="text-xs uppercase text-text-soft">{key}</dt><dd className="text-xl font-semibold">{value}</dd></div>)}</dl></section>}
  </div>;
}
