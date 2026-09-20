"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileJson,
  RefreshCw,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { api, type ImportReport } from "../api";
import { useAppContext } from "./app-provider";

const input =
  "min-h-11 w-full rounded-md border border-[color:var(--admin-border)] bg-[color:var(--admin-control)] px-3 text-sm text-[color:var(--admin-text)] placeholder:text-[color:var(--admin-muted)]";
const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold disabled:opacity-50";
const primaryButton = `${button} bg-[color:var(--admin-accent)] text-[#07130d] hover:bg-[color:var(--admin-accent-strong)]`;
const secondaryButton = `${button} border border-[color:var(--admin-border-strong)] bg-[color:var(--admin-surface)] text-[color:var(--admin-text)] hover:border-[color:var(--admin-accent)]`;

const reportLabels: Record<keyof ImportReport["counts"], string> = {
  total: "Total records",
  valid: "Dry-run valid",
  imported: "Imported",
  skipped: "Skipped",
  failed: "Failed",
};

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const value = (error as { message: unknown }).message;
    return Array.isArray(value) ? value.join(" ") : String(value);
  }
  return "The operation could not be completed.";
}

function ReportMetric({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "neutral" | "good" | "warn";
  value: number;
}) {
  return (
    <div className={`admin-metric admin-metric--${tone}`}>
      <dt>{label}</dt>
      <dd>{value.toLocaleString()}</dd>
    </div>
  );
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn";
}) {
  return <span className={`admin-status-pill admin-status-pill--${tone}`}>{children}</span>;
}

export function AdminPortability() {
  const { session } = useAppContext();
  const [ownerId, setOwnerId] = useState("");
  const [source, setSource] = useState("");
  const [archive, setArchive] = useState<Record<string, unknown> | null>(null);
  const [fileName, setFileName] = useState("");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"neutral" | "good" | "warn">("neutral");
  const [busy, setBusy] = useState(false);
  if (!session) return null;

  const dryRunPassed = Boolean(report?.dryRun && !report.counts.failed);

  async function download() {
    setBusy(true);
    setStatus("");
    try {
      const data = await api.exportEvents(
        {
          ...(ownerId.trim() && { ownerId: ownerId.trim() }),
          ...(source.trim() && { sourceEnvironment: source.trim() }),
        },
        session!.token,
      );
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `passmint-events-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatusTone("good");
      setStatus("Export prepared and downloaded.");
    } catch (error) {
      setStatusTone("warn");
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function select(file?: File) {
    setArchive(null);
    setReport(null);
    setFileName(file?.name ?? "");
    setStatus("");
    setStatusTone("neutral");
    if (!file) return;
    try {
      const value = JSON.parse(await file.text());
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Choose a valid Passmint JSON archive.");
      }
      setArchive(value);
      setStatusTone("good");
      setStatus("Archive loaded. Run validation before importing.");
    } catch (error) {
      setStatusTone("warn");
      setStatus(errorMessage(error));
    }
  }

  async function run(dryRun: boolean) {
    if (!archive) return;
    if (!dryRun && (!report?.dryRun || report.counts.failed)) {
      setStatusTone("warn");
      setStatus("Complete a successful dry run before importing.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const next = await api.importEvents(
        {
          archive,
          dryRun,
          onDuplicate: "skip",
          ...(ownerId.trim() && { targetOwnerId: ownerId.trim() }),
        },
        session!.token,
      );
      setReport(next);
      setStatusTone(next.counts.failed ? "warn" : "good");
      setStatus(next.summary);
    } catch (error) {
      setStatusTone("warn");
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-workspace">
      <aside className="admin-sidebar" aria-label="Administration sections">
        <div>
          <p className="admin-sidebar__eyebrow">Admin console</p>
          <h1>Administration</h1>
        </div>
        <nav>
          <a href="#portability" aria-current="page">
            <Upload size={17} />
            Event portability
          </a>
        </nav>
      </aside>

      <main className="admin-console" id="portability">
        <section className="admin-hero">
          <div>
            <p className="admin-kicker">Event portability</p>
            <h2>Import and export events</h2>
            <p>
              Move event definitions between deployments. Every import requires a successful
              validation before data can be written.
            </p>
          </div>
        </section>

        <div className="admin-context-line">
          <span>Signed in as {session.user.name}</span>
          <span>{ownerId.trim() ? `Owner scope: ${ownerId.trim()}` : "All accessible owners"}</span>
          <span>{dryRunPassed ? "Validation passed" : "Validation required"}</span>
        </div>

        <div className="admin-portability-grid">
          <section className="admin-panel">
            <div className="admin-panel__heading">
              <span className="admin-panel__icon">
                <Download size={20} />
              </span>
              <div>
                <p>Step 1</p>
                <h3>Export events</h3>
              </div>
            </div>
            <p className="admin-panel__copy">
              Create a reviewed JSON archive from the current deployment. Leave owner blank when
              the administrator should export every event they can access.
            </p>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                Owner ID
                <input
                  className={input}
                  value={ownerId}
                  onChange={(event) => setOwnerId(event.target.value)}
                  placeholder="Optional account ID"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Source environment
                <input
                  className={input}
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  placeholder="production-east"
                />
              </label>
              <button className={primaryButton} disabled={busy} onClick={download}>
                {busy ? <RefreshCw size={18} /> : <Download size={18} />}
                Download archive
              </button>
            </div>
          </section>

          <section className="admin-panel" id="import-review">
            <div className="admin-panel__heading">
              <span className="admin-panel__icon">
                <Upload size={20} />
              </span>
              <div>
                <p>Step 2</p>
                <h3>Validate and import</h3>
              </div>
            </div>
            <p className="admin-panel__copy">
              File selection only loads the archive in the browser. Validate first, inspect the
              counts, then start the write operation when the report is clean.
            </p>
            <label className="admin-file-drop">
              <FileJson size={24} />
              <span>{fileName || "Choose a Passmint archive"}</span>
              <small>JSON archive only. No import starts from file selection.</small>
              <input
                type="file"
                accept="application/json,.json"
                onChange={(event) => select(event.target.files?.[0])}
              />
            </label>
            <div className="admin-action-row">
              <button className={secondaryButton} disabled={busy || !archive} onClick={() => run(true)}>
                <ClipboardCheck size={18} />
                Validate archive
              </button>
              <button
                className={primaryButton}
                disabled={busy || !archive || !dryRunPassed}
                onClick={() => run(false)}
              >
                <Upload size={18} />
                Start import
              </button>
            </div>
          </section>
        </div>

        {status && (
          <section className={`admin-alert admin-alert--${statusTone}`} role="status">
            {statusTone === "warn" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <p>{status}</p>
          </section>
        )}

        {report && (
          <section className="admin-report" aria-label="Latest portability report">
            <div className="admin-report__heading">
              <div>
                <p className="admin-kicker">Latest report</p>
                <h3>{report.dryRun ? "Validation result" : "Import result"}</h3>
              </div>
              <StatusPill tone={report.counts.failed ? "warn" : "good"}>
                {report.counts.failed ? "Needs attention" : report.dryRun ? "Ready to import" : "Completed"}
              </StatusPill>
            </div>
            <dl className="admin-report__metrics">
              {Object.entries(report.counts).map(([key, value]) => (
                <ReportMetric
                  key={key}
                  label={reportLabels[key as keyof ImportReport["counts"]]}
                  value={value}
                  tone={key === "failed" && value > 0 ? "warn" : key === "imported" || key === "valid" ? "good" : "neutral"}
                />
              ))}
            </dl>
            <div className="admin-report__summary">
              {report.counts.failed ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
              <p>{report.summary}</p>
            </div>
            <p className="admin-report__archive">Archive ID: {report.archiveId}</p>
          </section>
        )}

        <section className="admin-governance" id="governance">
          <ShieldCheck size={19} />
          <p>
            <strong>Protected workflow.</strong> Exports are read-only, duplicate records are
            skipped, and dry runs never write event data.
          </p>
        </section>
      </main>
    </div>
  );
}
