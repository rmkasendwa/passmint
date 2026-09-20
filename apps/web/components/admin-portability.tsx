"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileArchive,
  FileJson,
  RefreshCw,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { api, type ImportReport } from "../api";
import {
  createEventBundle,
  imageDataUrl,
  readEventArchive,
  type ImportedBundle,
} from "../archive-bundle";
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
  return (
    <span className={`admin-status-pill admin-status-pill--${tone}`}>
      {children}
    </span>
  );
}

export function AdminPortability() {
  const { session } = useAppContext();
  const [ownerId, setOwnerId] = useState("");
  const [source, setSource] = useState("");
  const [archive, setArchive] = useState<Record<string, unknown> | null>(null);
  const [bundleMedia, setBundleMedia] = useState<ImportedBundle["media"]>([]);
  const [uploadedArtwork, setUploadedArtwork] = useState<Record<
    string,
    string
  > | null>(null);
  const [fileName, setFileName] = useState("");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"neutral" | "good" | "warn">(
    "neutral",
  );
  const [busy, setBusy] = useState(false);
  if (!session) return null;

  const dryRunPassed = Boolean(report?.dryRun && !report.counts.failed);

  function save(blob: Blob, extension: "json" | "zip") {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `passmint-events-${new Date().toISOString().slice(0, 10)}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function exportedArchive() {
    return api.exportEvents(
      {
        ...(ownerId.trim() && { ownerId: ownerId.trim() }),
        ...(source.trim() && { sourceEnvironment: source.trim() }),
      },
      session!.token,
    );
  }

  async function downloadDefinitions() {
    setBusy(true);
    setStatus("");
    try {
      const data = await exportedArchive();
      save(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
        "json",
      );
      setStatusTone("good");
      setStatus("Definitions-only JSON downloaded. Artwork remains URL-based.");
    } catch (error) {
      setStatusTone("warn");
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function downloadComplete() {
    setBusy(true);
    setStatusTone("neutral");
    setStatus("Collecting event artwork...");
    try {
      const data = await exportedArchive();
      const bundle = await createEventBundle(data);
      save(bundle.blob, "zip");
      setStatusTone("good");
      setStatus(
        `Complete ZIP downloaded with ${bundle.mediaCount} artwork file${bundle.mediaCount === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      setStatusTone("warn");
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function select(file?: File) {
    setArchive(null);
    setBundleMedia([]);
    setUploadedArtwork(null);
    setReport(null);
    setFileName(file?.name ?? "");
    setStatus("");
    setStatusTone("neutral");
    if (!file) return;
    try {
      const value = await readEventArchive(file);
      setArchive(value.archive);
      setBundleMedia(value.media);
      setStatusTone("good");
      setStatus(
        value.media.length
          ? `Archive loaded and ${value.media.length} artwork file${value.media.length === 1 ? "" : "s"} verified. Run validation before importing.`
          : "Definitions-only archive loaded. Run validation before importing.",
      );
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
      let thumbnailOverrides = uploadedArtwork;
      if (!dryRun && bundleMedia.length) {
        const uploaded: Record<string, string> = { ...(uploadedArtwork ?? {}) };
        for (const [index, media] of bundleMedia.entries()) {
          if (uploaded[media.sourceId]) continue;
          setStatus(
            `Uploading artwork ${index + 1} of ${bundleMedia.length}...`,
          );
          const result = await api.uploadEventImage(
            {
              fileName: media.path.split("/").at(-1) ?? "artwork",
              contentType: media.contentType,
              dataUrl: imageDataUrl(media.bytes, media.contentType),
            },
            session!.token,
          );
          uploaded[media.sourceId] = result.url;
          setUploadedArtwork({ ...uploaded });
        }
        thumbnailOverrides = uploaded;
      }
      const next = await api.importEvents(
        {
          archive,
          dryRun,
          onDuplicate: "skip",
          ...(thumbnailOverrides && { thumbnailOverrides }),
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
              Move event definitions between deployments. Every import requires
              a successful validation before data can be written.
            </p>
          </div>
        </section>

        <div className="admin-context-line">
          <span>Signed in as {session.user.name}</span>
          <span>
            {ownerId.trim()
              ? `Owner scope: ${ownerId.trim()}`
              : "All accessible owners"}
          </span>
          <span>
            {dryRunPassed ? "Validation passed" : "Validation required"}
          </span>
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
              Download a complete ZIP with event artwork. Use definitions-only
              JSON when the target should continue using the existing artwork
              URLs.
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
              <div className="admin-action-row">
                <button
                  className={primaryButton}
                  disabled={busy}
                  onClick={downloadComplete}
                >
                  {busy ? <RefreshCw size={18} /> : <FileArchive size={18} />}
                  Download complete ZIP
                </button>
                <button
                  className={secondaryButton}
                  disabled={busy}
                  onClick={downloadDefinitions}
                >
                  <FileJson size={18} />
                  Definitions only
                </button>
              </div>
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
              ZIP artwork is verified locally and uploaded only when the real
              import starts. Validate first, inspect the counts, then apply the
              archive when the report is clean.
            </p>
            <label className="admin-file-drop">
              <FileArchive size={24} />
              <span>{fileName || "Choose a Passmint ZIP or JSON archive"}</span>
              <small>
                File selection and validation do not upload artwork or write
                event data.
              </small>
              <input
                type="file"
                accept="application/json,application/zip,.json,.zip"
                onChange={(event) => select(event.target.files?.[0])}
              />
            </label>
            <div className="admin-action-row">
              <button
                className={secondaryButton}
                disabled={busy || !archive}
                onClick={() => run(true)}
              >
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
          <section
            className={`admin-alert admin-alert--${statusTone}`}
            role="status"
          >
            {statusTone === "warn" ? (
              <AlertTriangle size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            <p>{status}</p>
          </section>
        )}

        {report && (
          <section
            className="admin-report"
            aria-label="Latest portability report"
          >
            <div className="admin-report__heading">
              <div>
                <p className="admin-kicker">Latest report</p>
                <h3>{report.dryRun ? "Validation result" : "Import result"}</h3>
              </div>
              <StatusPill tone={report.counts.failed ? "warn" : "good"}>
                {report.counts.failed
                  ? "Needs attention"
                  : report.dryRun
                    ? "Ready to import"
                    : "Completed"}
              </StatusPill>
            </div>
            <dl className="admin-report__metrics">
              {Object.entries(report.counts).map(([key, value]) => (
                <ReportMetric
                  key={key}
                  label={reportLabels[key as keyof ImportReport["counts"]]}
                  value={value}
                  tone={
                    key === "failed" && value > 0
                      ? "warn"
                      : key === "imported" || key === "valid"
                        ? "good"
                        : "neutral"
                  }
                />
              ))}
            </dl>
            <div className="admin-report__summary">
              {report.counts.failed ? (
                <XCircle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
              <p>{report.summary}</p>
            </div>
            <p className="admin-report__archive">
              Archive ID: {report.archiveId}
            </p>
          </section>
        )}

        <section className="admin-governance" id="governance">
          <ShieldCheck size={19} />
          <p>
            <strong>Protected workflow.</strong> Exports are read-only,
            duplicate records are skipped, and dry runs never write event data.
          </p>
        </section>
      </main>
    </div>
  );
}
