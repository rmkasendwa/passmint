"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  DatabaseBackup,
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
  const hasImportReport = Boolean(report && !report.dryRun);
  const archiveReady = Boolean(archive);

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
          <p className="admin-sidebar__eyebrow">Platform control</p>
          <h1>Administration</h1>
        </div>
        <nav>
          <a href="#portability" aria-current="page">
            <DatabaseBackup size={17} />
            Event portability
          </a>
          <a href="#import-review">
            <ClipboardCheck size={17} />
            Import review
          </a>
          <a href="#governance">
            <ShieldCheck size={17} />
            Governance
          </a>
        </nav>
        <div className="admin-sidebar__note">
          <ShieldCheck size={18} />
          <p>Exports are read-only. Imports stay locked until a successful dry run clears the archive.</p>
        </div>
      </aside>

      <main className="admin-console" id="portability">
        <section className="admin-hero">
          <div>
            <p className="admin-kicker">Event operations</p>
            <h2>Move event data with evidence, review, and control.</h2>
            <p>
              Export portable event definitions, validate archives before writes, and keep the
              latest import report visible while the operation is still fresh.
            </p>
          </div>
          <div className="admin-hero__status" aria-label="Portability workflow status">
            <StatusPill tone={archiveReady ? "good" : "neutral"}>
              {archiveReady ? "Archive loaded" : "Awaiting archive"}
            </StatusPill>
            <ArrowRight size={16} />
            <StatusPill tone={dryRunPassed ? "good" : report?.counts.failed ? "warn" : "neutral"}>
              {dryRunPassed ? "Dry run passed" : "Dry run required"}
            </StatusPill>
            <ArrowRight size={16} />
            <StatusPill tone={hasImportReport ? "good" : "neutral"}>
              {hasImportReport ? "Import recorded" : "Import locked"}
            </StatusPill>
          </div>
        </section>

        <section className="admin-overview" aria-label="Operational summary">
          <div>
            <span>Signed in as</span>
            <strong>{session.user.name}</strong>
            <small>{session.user.role.replace("_", " ")}</small>
          </div>
          <div>
            <span>Owner scope</span>
            <strong>{ownerId.trim() || "All accessible owners"}</strong>
            <small>Used for export filters and target imports</small>
          </div>
          <div>
            <span>Review gate</span>
            <strong>{dryRunPassed ? "Passed" : "Required"}</strong>
            <small>Real imports stay disabled until validation succeeds</small>
          </div>
        </section>

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

        <section className="admin-report" aria-label="Latest portability report">
          <div className="admin-report__heading">
            <div>
              <p className="admin-kicker">Latest report</p>
              <h3>{report ? (report.dryRun ? "Validation result" : "Import result") : "No archive reviewed yet"}</h3>
            </div>
            {report ? (
              <StatusPill tone={report.counts.failed ? "warn" : "good"}>
                {report.counts.failed ? "Needs attention" : report.dryRun ? "Ready to import" : "Completed"}
              </StatusPill>
            ) : (
              <StatusPill>Waiting</StatusPill>
            )}
          </div>
          {report ? (
            <>
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
            </>
          ) : (
            <div className="admin-empty-report">
              <FileJson size={26} />
              <p>Load an archive and run validation to populate counts before any import can begin.</p>
            </div>
          )}
        </section>

        <section className="admin-governance" id="governance">
          <div>
            <ShieldCheck size={20} />
            <h3>Operational guardrails</h3>
          </div>
          <ul>
            <li>Duplicate source records are skipped during import.</li>
            <li>Dry runs do not write events, categories, tickets, or import receipts.</li>
            <li>Owner ID applies as a source filter for exports and target mapping for imports.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
