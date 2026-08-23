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
import { EventThumbnail } from "../components/event-thumbnail";
import {
  eventCategory,
  eventStatus,
  eventTone,
  initials,
} from "../event-utils";
import { dateTime, money } from "../formatters";
import { usePassmint } from "../passmint-app";

export function DashboardScreen() {
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
  } = usePassmint();

  if (!session) return null;

  return (
    <section className="dashboard-layout">
      <div className="dashboard-hero">
        <div>
          <p className="section-kicker">Dashboard</p>
          <h1>Run every event from one place.</h1>
          <p>
            Create new events, track your hosted lineup, and scan tickets at the
            door with your Passmint account.
          </p>
        </div>
        <div className="dashboard-identity">
          <span>{initials(session.user.name)}</span>
          <strong>{session.user.name}</strong>
          <small>{session.user.email}</small>
        </div>
      </div>

      <section className="dashboard-stats" aria-label="Dashboard summary">
        <article>
          <small>Hosted events</small>
          <strong>{dashboardEvents.length}</strong>
        </article>
        <article>
          <small>Upcoming</small>
          <strong>{dashboardUpcomingCount}</strong>
        </article>
        <article>
          <small>Total capacity</small>
          <strong>{dashboardCapacity.toLocaleString("en-UG")}</strong>
        </article>
        <article>
          <small>Sellout value</small>
          <strong>{money.format(dashboardRevenuePotential / 100)}</strong>
        </article>
      </section>

      <div className="dashboard-workbench">
        <section className="event-publisher-panel">
          <div className="panel-heading">
            <ImagePlus size={22} />
            <h2>Create event</h2>
          </div>
          <div className="thumbnail-preview">
            <EventThumbnail
              event={hostPreviewEvent}
              tone="tone-2"
              variant="preview"
            />
          </div>
          <form className="form-grid" onSubmit={publishEvent}>
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
            <div className="split-fields">
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
            <label className="upload-field">
              <span>Event artwork photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  selectThumbnail(event.target.files?.[0] ?? null)
                }
              />
              <span>
                <Upload size={17} />
                {hostThumbnailName || "Optional image upload"}
              </span>
            </label>
            {hostEvent.thumbnailUrl && (
              <button
                className="secondary-action"
                type="button"
                onClick={() => selectThumbnail(null)}
              >
                Remove photo
              </button>
            )}
            <button
              className="primary-action"
              type="submit"
              disabled={!canPublishEvents}
            >
              <ImagePlus size={18} />
              Create event
            </button>
          </form>
          <p className="helper-line">
            Photos are optional. Without one, Passmint creates a branded event
            artwork automatically.
          </p>
          {hostState && <p className="state-line">{hostState}</p>}
        </section>

        <div className="dashboard-ops">
          <section className="host-events-panel">
            <div className="panel-heading">
              <CalendarDays size={22} />
              <h2>Your events</h2>
            </div>
            {dashboardEvents.length === 0 ? (
              <div className="empty-dashboard-card">
                <TicketIcon size={34} />
                <strong>No hosted events yet</strong>
                <span>Create your first event and it will appear here.</span>
              </div>
            ) : (
              <div className="host-event-list">
                {dashboardEvents.map((event, index) => (
                  <article className="host-event-card" key={event.id}>
                    <EventThumbnail
                      event={event}
                      tone={eventTone(index)}
                      variant="preview"
                    />
                    <div>
                      <span className="ticket-badges compact">
                        <span>{eventStatus(event)}</span>
                        <span>{eventCategory(event)}</span>
                      </span>
                      <h3>{event.name}</h3>
                      <p>{event.description}</p>
                      <div className="host-event-meta">
                        <span>
                          <CalendarDays size={15} />
                          {dateTime.format(new Date(event.startsAt))}
                        </span>
                        <span>
                          <MapPin size={15} />
                          {event.venue}
                        </span>
                        <strong>
                          {event.capacity.toLocaleString("en-UG")} spots
                        </strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="gate-panel">
            <div>
              <div className="panel-heading">
                <ScanLine size={22} />
                <h2>Ticket scanning</h2>
              </div>
              <p>
                Scan QR tickets for events you created. Accepted tickets are
                marked entered and cannot be reused.
              </p>
              <div className="verifier-access granted">
                <ShieldCheck size={18} />
                {session.user.name} can scan owned-event tickets.
              </div>
            </div>
            <div className="scanner-box">
              {cameraEnabled ? (
                <video ref={videoRef} muted playsInline />
              ) : (
                <div className="scanner-placeholder ready">
                  <ShieldCheck size={54} />
                  <span>Ready to scan</span>
                </div>
              )}
            </div>
            <div className="gate-actions">
              <button
                type="button"
                className="secondary-action"
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
                className="primary-action"
                onClick={() => void scan()}
                disabled={!canVerifyTickets}
              >
                Validate
              </button>
            </div>
            {scanState && <p className="state-line">{scanState}</p>}
            {gateResult && (
              <div className={`gate-result ${gateResult.result}`}>
                {gateResult.result === "accepted" ? (
                  <CheckCircle2 size={28} />
                ) : (
                  <XCircle size={28} />
                )}
                <div>
                  <strong>{gateResult.result.replace("_", " ")}</strong>
                  <span>
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
