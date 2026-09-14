"use client";
import { DataSkeleton } from "./page-skeleton";

import { FormEvent, useEffect, useState } from "react";
import { api, AttendeePage } from "../api";
import { dateTime } from "../formatters";
import { TicketActivity } from "./ticket-activity";

export function EventAttendees({
  eventId,
  token,
  initialData,
}: {
  eventId: string;
  token: string;
  initialData?: AttendeePage;
}) {
  const [selected, setSelected] = useState<{
    id: string;
    buyerName: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ search: "", page: 1, refresh: 0 });
  const [data, setData] = useState<AttendeePage | null>(initialData ?? null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!initialData);
  useEffect(() => {
    let active = true;
    if (query.refresh || query.page !== data?.page || query.search || !initialData) {
      setLoading(true);
      setData(null);
    }
    setError("");
    void api
      .eventAttendees(eventId, query.search, query.page, token)
      .then((value) => {
        if (active) setData(value);
      })
      .catch((error) => {
        if (active) setError(error?.message ?? "Unable to load attendees.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId, token, query]);

  function find(event: FormEvent) {
    event.preventDefault();
    setQuery((current) => ({
      search: search.trim(),
      page: 1,
      refresh: current.refresh + 1,
    }));
  }
  const button =
    "min-h-11 rounded-lg border border-border bg-surface-muted px-4 text-text disabled:opacity-50";
  const labels = {
    issued: "Issued",
    checked_in: "Checked in",
    cancelled: "Cancelled",
  };
  return (
    <section
      className="grid min-w-0 gap-4 rounded-lg border border-border bg-surface-raised p-4.5"
      aria-labelledby="attendees-heading"
    >
      <h2 id="attendees-heading" className="m-0 text-[1.55rem] text-text">
        Attendees
      </h2>
      <p className="m-0 text-text-muted">
        One row per ticket. Issued tickets do not confirm payment; payment
        verification is not yet available.
      </p>
      <form className="flex flex-wrap items-end gap-2" onSubmit={find}>
        <label className="grid min-w-0 flex-1 gap-2 text-text">
          Search by name or email
          <input
            className="min-h-11 w-full rounded-lg border border-border bg-surface-muted px-3 text-text"
            type="search"
            maxLength={100}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <button className={button} type="submit">
          Search
        </button>
        <button
          className={button}
          type="button"
          onClick={() =>
            setQuery((current) => ({
              ...current,
              refresh: current.refresh + 1,
            }))
          }
          disabled={loading}
        >
          Refresh
        </button>
      </form>
      {loading && <DataSkeleton kind="attendees" />}
      {error && (
        <p role="alert" className="m-0 text-text">
          {error}
        </p>
      )}
      {data && (
        <>
          {data.attendees.length === 0 ? (
            <p role="status" className="m-0 text-text-muted">
              {query.search
                ? "No attendees match this search."
                : "No attendees on this page."}
            </p>
          ) : (
            <div
              className="overflow-x-auto"
              role="region"
              aria-label="Attendee list"
              tabIndex={0}
            >
              <table className="w-full text-left text-sm text-text">
                <caption className="sr-only">
                  Ticket holders, ticket categories, issue status and check-in
                  times
                </caption>
                <thead>
                  <tr>
                    {[
                      "Ticket holder",
                      "Ticket category",
                      "Ticket status",
                      "Issued",
                      "Check-in",
                      "History",
                    ].map((label) => (
                      <th
                        className="border-b border-border p-3"
                        scope="col"
                        key={label}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.attendees.map((attendee) => (
                    <tr key={attendee.id}>
                      <td className="border-b border-border p-3">
                        <span className="block font-semibold">
                          {attendee.buyerName || "Name not provided"}
                        </span>
                        <span className="break-all text-text-muted">
                          {attendee.buyerEmail || "Email not provided"}
                        </span>
                      </td>
                      <td className="border-b border-border p-3">
                        {attendee.ticketTypeName}
                      </td>
                      <td className="border-b border-border p-3">
                        {labels[attendee.status]}
                      </td>
                      <td className="border-b border-border p-3">
                        {dateTime.format(new Date(attendee.createdAt))}
                      </td>
                      <td className="border-b border-border p-3">
                        {attendee.checkedInAt
                          ? dateTime.format(new Date(attendee.checkedInAt))
                          : "Not checked in"}
                      </td>
                      <td className="border-b border-border p-3">
                        <button
                          className={button}
                          type="button"
                          aria-label={`View ticket history for ${attendee.buyerName}`}
                          onClick={() => setSelected(attendee)}
                        >
                          View history
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <nav
            className="flex flex-wrap items-center gap-3"
            aria-label="Attendee pages"
          >
            <button
              className={button}
              type="button"
              disabled={query.page === 1}
              onClick={() =>
                setQuery((current) => ({ ...current, page: current.page - 1 }))
              }
            >
              Previous
            </button>
            <span className="text-text" role="status">
              Page {data.page} · {data.attendees.length} tickets shown
            </span>
            <button
              className={button}
              type="button"
              disabled={!data.hasMore}
              onClick={() =>
                setQuery((current) => ({ ...current, page: current.page + 1 }))
              }
            >
              Next
            </button>
          </nav>
        </>
      )}
      {selected && (
        <TicketActivity
          key={`${token}:${selected.id}`}
          ticketId={selected.id}
          buyerName={selected.buyerName}
          token={token}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
