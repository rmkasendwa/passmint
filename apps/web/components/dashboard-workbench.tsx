"use client";

import {
  CalendarDays,
  CheckCircle2,
  ImagePlus,
  MapPin,
  ScanLine,
  ShieldCheck,
  Ticket as TicketIcon,
  Upload,
  XCircle,
} from "lucide-react";
import { dateTime, money } from "../formatters";
import {
  eventCategory,
  eventStatus,
  eventTone,
  initials,
} from "../event-utils";
import { useAppContext } from "./app-provider";
import { EventThumbnail } from "./event-thumbnail";

const sectionKicker =
  "mb-2 text-[0.78rem] font-(weight:--weight-semibold) uppercase tracking-[0.08em] text-(color:--accent)";
const panel =
  "rounded-lg border border-(color:--border) bg-(color:--surface-raised) shadow-[0_18px_52px_rgb(0_0_0/15%)]";
const panelHeading =
  "mb-3 flex items-center gap-2.5 text-(color:--text) [&_h2]:mb-0 [&_h2]:text-[1.55rem] [&_svg]:text-(color:--accent)";
const primaryAction =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-(color:--button-bg) px-4 font-(weight:--weight-bold) text-(color:--button-text) hover:bg-(color:--accent)";
const secondaryAction =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-(color:--border) bg-(color:--surface-muted) px-4 font-(weight:--weight-bold) text-(color:--text)";
const formGrid =
  "grid gap-3 [&_label]:grid [&_label]:gap-[7px] [&_label]:text-[0.82rem] [&_label]:font-(weight:--weight-semibold) [&_label]:text-(color:--text-muted) [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-(color:--border) [&_input]:bg-(color:--surface-elevated) [&_input]:px-3 [&_input]:text-(color:--text) [&_input]:focus:border-(color:--accent) [&_input]:focus:outline-[3px_solid_rgb(22_125_119/18%)] [&_textarea]:min-h-[92px] [&_textarea]:w-full [&_textarea]:min-w-0 [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-(color:--border) [&_textarea]:bg-(color:--surface-elevated) [&_textarea]:px-3 [&_textarea]:py-[11px] [&_textarea]:text-(color:--text) [&_textarea]:focus:border-(color:--accent) [&_textarea]:focus:outline-[3px_solid_rgb(22_125_119/18%)]";
const helperLine = "mb-0 text-[0.88rem] leading-[1.5] text-(color:--text-soft)";
const stateLine =
  "mb-0 rounded-lg bg-(color:--accent-soft) p-3 text-[0.92rem] font-(weight:--weight-medium) text-(color:--accent)";
const statCard =
  "grid min-h-[126px] content-end gap-2.5 rounded-lg border border-(color:--border) bg-[linear-gradient(180deg,rgb(255_255_255/6%),transparent_58%),var(--surface-raised)] p-[18px] shadow-[0_18px_50px_rgb(0_0_0/16%)] [&_small]:text-[0.78rem] [&_small]:font-(weight:--weight-semibold) [&_small]:uppercase [&_small]:tracking-[0.08em] [&_small]:text-(color:--text-soft) [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:text-[clamp(1.8rem,3vw,2.75rem)] [&_strong]:font-(weight:--weight-bold) [&_strong]:leading-[0.95] [&_strong]:text-(color:--text)";
const compactBadge =
  "inline-flex min-h-7 items-center rounded-full border border-(color:--border) bg-(color:--surface-muted) px-[11px] text-[0.74rem] font-(weight:--weight-semibold) uppercase text-(color:--text)";

export function DashboardWorkbench() {
  const {
    cameraEnabled,
    canPublishEvents,
    canVerifyTickets,
    dashboardCapacity,
    dashboardEvents,
    dashboardRevenuePotential,
    dashboardUpcomingCount,
    gateCode,
    gateResult,
    hostEvent,
    hostPreviewEvent,
    hostState,
    hostThumbnailName,
    publishEvent,
    scan,
    scanState,
    selectThumbnail,
    session,
    setCameraEnabled,
    setGateCode,
    updateHostEvent,
    videoRef,
  } = useAppContext();

  if (!session) return null;

  return (
    <section className="mx-auto mt-[26px] w-[min(1180px,calc(100%-32px))] max-w-[1180px]">
      <div className="mb-[18px] grid min-h-[420px] grid-cols-[minmax(0,1fr)_auto] items-end gap-6 overflow-hidden rounded-[22px] border border-(color:--border) bg-[linear-gradient(90deg,rgb(8_9_14/78%),rgb(8_9_14/18%)),url('https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1800&q=85')] bg-cover bg-center p-[clamp(24px,5vw,52px)] shadow-[0_28px_90px_rgb(0_0_0/28%)] max-[1120px]:grid-cols-1 max-[820px]:min-h-[520px]">
        <div>
          <p className={sectionKicker}>Dashboard</p>
          <h1 className="mb-3 max-w-[780px] text-[clamp(3rem,7vw,6.7rem)] font-(weight:--weight-bold) leading-[0.94] tracking-normal text-white">
            Run every event from one place.
          </h1>
          <p className="mb-0 max-w-[580px] text-[1.05rem] leading-[1.55] text-[rgb(255_255_255/76%)]">
            Create new events, track your hosted lineup, and scan tickets at the
            door with your Passmint account.
          </p>
        </div>
        <div className="grid min-w-[230px] gap-1.5 rounded-2xl border border-[rgb(255_255_255/14%)] bg-[rgb(255_255_255/10%)] p-4 text-white backdrop-blur-xl max-[820px]:min-w-0">
          <span className="mb-1 grid size-12 place-items-center rounded-xl bg-white text-[0.94rem] font-(weight:--weight-bold) text-[#101010]">
            {initials(session.user.name)}
          </span>
          <strong className="truncate text-[1.05rem]">
            {session.user.name}
          </strong>
          <small className="truncate text-[0.83rem] text-[rgb(255_255_255/68%)]">
            {session.user.email}
          </small>
        </div>
      </div>

      <section
        className="mb-[18px] grid grid-cols-4 gap-3 max-[1120px]:grid-cols-2 max-[600px]:grid-cols-1"
        aria-label="Dashboard summary"
      >
        <article className={statCard}>
          <small>Hosted events</small>
          <strong>{dashboardEvents.length}</strong>
        </article>
        <article className={statCard}>
          <small>Upcoming</small>
          <strong>{dashboardUpcomingCount}</strong>
        </article>
        <article className={statCard}>
          <small>Total capacity</small>
          <strong>{dashboardCapacity.toLocaleString("en-UG")}</strong>
        </article>
        <article className={statCard}>
          <small>Sellout value</small>
          <strong>{money.format(dashboardRevenuePotential / 100)}</strong>
        </article>
      </section>

      <div className="grid grid-cols-[minmax(360px,430px)_minmax(0,1fr)] items-start gap-[18px] max-[1120px]:grid-cols-1">
        <section className={`${panel} grid gap-3.5 p-[18px]`}>
          <div className={panelHeading}>
            <ImagePlus size={22} />
            <h2>Create event</h2>
          </div>
          <div className="overflow-hidden rounded-lg bg-[#101010]">
            <EventThumbnail
              event={hostPreviewEvent}
              tone="tone-2"
              variant="preview"
            />
          </div>
          <form className={formGrid} onSubmit={publishEvent}>
            <label>
              Event name
              <input
                value={hostEvent.name}
                onChange={(event) =>
                  updateHostEvent("name", event.target.value)
                }
                placeholder="Kampala rooftop sessions"
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={hostEvent.description}
                onChange={(event) =>
                  updateHostEvent("description", event.target.value)
                }
                placeholder="Short public summary"
                required
              />
            </label>
            <label>
              Venue
              <input
                value={hostEvent.venue}
                onChange={(event) =>
                  updateHostEvent("venue", event.target.value)
                }
                placeholder="Venue, city"
                required
              />
            </label>
            <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] gap-2.5 max-[820px]:grid-cols-1">
              <label>
                Starts
                <input
                  type="datetime-local"
                  value={hostEvent.startsAt}
                  onChange={(event) =>
                    updateHostEvent("startsAt", event.target.value)
                  }
                  required
                />
              </label>
              <label>
                Capacity
                <input
                  min={1}
                  type="number"
                  value={hostEvent.capacity}
                  onChange={(event) =>
                    updateHostEvent("capacity", Number(event.target.value))
                  }
                  required
                />
              </label>
            </div>
            <label>
              Price in UGX
              <input
                min={0}
                type="number"
                value={hostEvent.priceCents / 100}
                onChange={(event) =>
                  updateHostEvent(
                    "priceCents",
                    Number(event.target.value) * 100,
                  )
                }
                required
              />
            </label>
            <label className="relative grid gap-[7px]">
              <span>Event artwork photo</span>
              <input
                className="absolute inset-0 cursor-pointer opacity-0"
                type="file"
                accept="image/*"
                onChange={(event) =>
                  selectThumbnail(event.target.files?.[0] ?? null)
                }
              />
              <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-dashed border-(color:--border-strong) bg-(color:--surface-muted) px-3 font-(weight:--weight-semibold) text-(color:--accent)">
                <Upload size={17} />
                {hostThumbnailName || "Optional image upload"}
              </span>
            </label>
            {hostEvent.thumbnailUrl && (
              <button
                className={secondaryAction}
                type="button"
                onClick={() => selectThumbnail(null)}
              >
                Remove photo
              </button>
            )}
            <button
              className={primaryAction}
              type="submit"
              disabled={!canPublishEvents}
            >
              <ImagePlus size={18} />
              Create event
            </button>
          </form>
          <p className={helperLine}>
            Photos are optional. Without one, Passmint creates a branded event
            artwork automatically.
          </p>
          {hostState && <p className={stateLine}>{hostState}</p>}
        </section>

        <div className="grid min-w-0 gap-[18px]">
          <section className={`${panel} grid gap-3.5 p-[18px]`}>
            <div className={panelHeading}>
              <CalendarDays size={22} />
              <h2>Your events</h2>
            </div>
            {dashboardEvents.length === 0 ? (
              <div className="grid min-h-[220px] place-items-center gap-2 rounded-[18px] border border-dashed border-(color:--border-strong) bg-(color:--surface-muted) p-[22px] text-center text-(color:--text-muted) [&_strong]:text-[1.2rem] [&_strong]:text-(color:--text) [&_svg]:text-(color:--accent)">
                <TicketIcon size={34} />
                <strong>No hosted events yet</strong>
                <span>Create your first event and it will appear here.</span>
              </div>
            ) : (
              <div className="grid gap-3">
                {dashboardEvents.map((event, index) => (
                  <article
                    className="grid min-w-0 grid-cols-[190px_minmax(0,1fr)] gap-4 rounded-[18px] border border-(color:--border) bg-(color:--surface-muted) p-3 max-[820px]:grid-cols-1"
                    key={event.id}
                  >
                    <EventThumbnail
                      event={event}
                      tone={eventTone(index)}
                      variant="preview"
                    />
                    <div>
                      <span className="flex flex-wrap gap-2">
                        <span className={compactBadge}>
                          {eventStatus(event)}
                        </span>
                        <span className={compactBadge}>
                          {eventCategory(event)}
                        </span>
                      </span>
                      <h3 className="my-3 line-clamp-2 text-[1.45rem] font-(weight:--weight-bold) leading-[1.05] text-(color:--text)">
                        {event.name}
                      </h3>
                      <p className="mb-3 line-clamp-2 leading-[1.45] text-(color:--text-muted)">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap gap-2 [&_span]:inline-flex [&_span]:min-h-8 [&_span]:items-center [&_span]:gap-[7px] [&_span]:rounded-full [&_span]:bg-(color:--surface-raised) [&_span]:px-2.5 [&_span]:text-[0.82rem] [&_span]:font-(weight:--weight-medium) [&_span]:text-(color:--text-muted) [&_svg]:text-(color:--accent)">
                        <span>
                          <CalendarDays size={15} />
                          {dateTime.format(new Date(event.startsAt))}
                        </span>
                        <span>
                          <MapPin size={15} />
                          {event.venue}
                        </span>
                        <strong className="inline-flex min-h-8 items-center gap-[7px] rounded-full bg-(color:--surface-raised) px-2.5 text-[0.82rem] font-(weight:--weight-medium) text-(color:--price)">
                          {event.capacity.toLocaleString("en-UG")} spots
                        </strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="grid max-w-[1360px] grid-cols-[0.7fr_1fr] items-center gap-4 rounded-lg border border-(color:--border) bg-[#101010] p-[22px] text-white shadow-[0_18px_44px_rgb(18_24_31/6%)] max-[1120px]:grid-cols-1">
            <div>
              <div className="mb-3 flex items-center gap-2.5 text-white [&_h2]:mb-0 [&_h2]:text-[1.55rem]">
                <ScanLine size={22} />
                <h2>Ticket scanning</h2>
              </div>
              <p className="mb-0 text-[rgb(255_255_255/72%)]">
                Scan QR tickets for events you created. Accepted tickets are
                marked entered and cannot be reused.
              </p>
              <div className="mt-4 inline-flex min-h-[38px] items-center gap-2 rounded-lg bg-[#dff7e8] px-[11px] font-(weight:--weight-semibold) text-[#14532d]">
                <ShieldCheck size={18} />
                {session.user.name} can scan owned-event tickets.
              </div>
            </div>
            <div className="grid min-h-[230px] place-items-center overflow-hidden rounded-lg border border-[rgb(255_255_255/16%)] bg-[#191919] [&_video]:h-[230px] [&_video]:w-full [&_video]:object-cover">
              {cameraEnabled ? (
                <video ref={videoRef} muted playsInline />
              ) : (
                <div className="grid h-[230px] w-full place-items-center gap-2.5 text-[#8ddbd3] [&_span]:font-(weight:--weight-medium) [&_span]:text-[rgb(255_255_255/78%)]">
                  <ShieldCheck size={54} />
                  <span>Ready to scan</span>
                </div>
              )}
            </div>
            <div className="col-start-2 grid grid-cols-[auto_1fr_auto] gap-2.5 max-[1120px]:col-auto max-[820px]:grid-cols-1 [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-(color:--border) [&_input]:bg-(color:--surface-elevated) [&_input]:px-3 [&_input]:text-(color:--text)">
              <button
                type="button"
                className={secondaryAction}
                onClick={() => setCameraEnabled((value) => !value)}
                disabled={!canVerifyTickets}
              >
                <ScanLine size={18} />
                {cameraEnabled ? "Stop camera" : "Start camera"}
              </button>
              <input
                placeholder="Paste or type ticket code"
                value={gateCode}
                onChange={(event) => setGateCode(event.target.value)}
              />
              <button
                type="button"
                className={primaryAction}
                onClick={() => void scan()}
                disabled={!canVerifyTickets}
              >
                Validate
              </button>
            </div>
            {scanState && <p className={stateLine}>{scanState}</p>}
            {gateResult && (
              <div
                className={`col-start-2 flex items-center gap-3 rounded-lg p-3.5 max-[1120px]:col-auto ${
                  gateResult.result === "accepted"
                    ? "bg-[#dff7e8] text-[#14532d]"
                    : "bg-[#ffe8df] text-[#8d2718]"
                }`}
              >
                {gateResult.result === "accepted" ? (
                  <CheckCircle2 size={28} />
                ) : (
                  <XCircle size={28} />
                )}
                <div>
                  <strong className="block capitalize">
                    {gateResult.result.replace("_", " ")}
                  </strong>
                  <span className="break-words">
                    {gateResult.ticket?.buyerName ?? gateResult.message}
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
