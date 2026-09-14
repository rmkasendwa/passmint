import type { ReactNode } from "react";

export type SkeletonView =
  | "discovery"
  | "event"
  | "manage"
  | "events"
  | "reports"
  | "create"
  | "scan"
  | "login"
  | "register"
  | "forgot"
  | "reset"
  | "about"
  | "help"
  | "organizers";
const block = (className = "h-5 w-full") => (
  <div className={`rounded-lg bg-surface-muted ${className}`} />
);
const panel = (children: ReactNode) => (
  <div className="grid content-start gap-5 rounded-xl border border-border bg-surface-raised p-6">
    {children}
  </div>
);
const fields = (count: number) =>
  Array.from({ length: count }, (_, i) => (
    <div key={i} className="grid gap-2">
      {block("h-3 w-24")}
      {block("h-12 w-full")}
    </div>
  ));
const cards = (count: number) =>
  Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className="grid gap-4 rounded-xl border border-border bg-surface-raised p-4"
    >
      {block("aspect-video w-full")}
      {block("h-6 w-3/4")}
      {block("h-4 w-1/2")}
    </div>
  ));

export function DataSkeleton({
  kind,
}: {
  kind: "attendees" | "metrics" | "sales" | "activity";
}) {
  return (
    <div role="status" aria-label={`Loading ${kind}`} className="grid gap-4">
      <span className="sr-only">Loading {kind}�</span>
      <div aria-hidden="true" className="grid gap-4 motion-safe:animate-pulse">
        {kind === "attendees" || kind === "activity" ? (
          Array.from({ length: kind === "attendees" ? 5 : 3 }, (_, i) => (
            <div key={i} className="flex gap-4 border-b border-border py-3">
              {block("h-8 w-1/3")}
              {block("h-8 flex-1")}
            </div>
          ))
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i}>{block("h-24 w-full")}</div>
              ))}
            </div>
            {block("h-52 w-full")}
          </>
        )}
      </div>
    </div>
  );
}

export function PageSkeleton({ view }: { view: SkeletonView }) {
  const auth = ["login", "register", "forgot", "reset"].includes(view);
  let content: ReactNode;
  if (auth) {
    content = (
      <div className="mx-auto grid w-full max-w-md gap-6 py-12">
        {panel(
          <>
            {block("h-9 w-3/4")}
            {block("h-4 w-full")}
            {fields(view === "register" ? 4 : view === "forgot" ? 1 : 2)}
            {block("h-12 w-full")}
            {block("h-4 w-2/3")}
          </>,
        )}
      </div>
    );
  } else if (view === "event" || view === "manage") {
    content = (
      <>
        {block("h-5 w-48")}
        {block("h-16 w-3/4")}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="grid gap-5">
            {panel(
              <>
                {block("aspect-video w-full")}
                {block("h-28 w-full")}
              </>,
            )}
            {view === "manage" && <DataSkeleton kind="attendees" />}
          </div>
          <div className="grid content-start gap-5">
            {panel(
              <>
                {block("h-8 w-2/3")}
                {fields(2)}
                {block("h-12 w-full")}
              </>,
            )}
            {panel(block("h-48 w-full"))}
          </div>
        </div>
      </>
    );
  } else if (view === "reports") {
    content = (
      <>
        {block("h-12 w-64")}
        <DataSkeleton kind="sales" />
      </>
    );
  } else if (view === "scan") {
    content = (
      <>
        {block("h-12 w-64")}
        <div className="grid gap-5 md:grid-cols-2">
          {panel(
            <>
              {block("aspect-square w-full")}
              {block("h-12 w-full")}
            </>,
          )}
          {panel(
            <>
              {block("h-8 w-2/3")}
              {fields(1)}
              {block("h-12 w-full")}
            </>,
          )}
        </div>
      </>
    );
  } else if (view === "create") {
    content = (
      <>
        {block("h-12 w-72")}
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          {panel(
            <>
              {fields(5)}
              {block("h-32 w-full")}
            </>,
          )}
          {panel(
            <>
              {block("aspect-video w-full")}
              {block("h-8 w-3/4")}
              {block("h-24 w-full")}
            </>,
          )}
        </div>
      </>
    );
  } else if (view === "discovery" || view === "events") {
    content = (
      <>
        {block(view === "discovery" ? "h-64 w-full" : "h-12 w-72")}
        {block("h-12 w-full")}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards(view === "discovery" ? 6 : 3)}
        </div>
      </>
    );
  } else {
    content = (
      <>
        {block("h-5 w-32")}
        {block("h-20 w-3/4")}
        {block("h-12 w-2/3")}
        {view === "help" ? (
          <>
            {block("h-14 w-full")}
            {fields(5)}
          </>
        ) : view === "about" ? (
          <div className="grid gap-5 md:grid-cols-2">
            {panel(block("h-72 w-full"))}
            {panel(
              <>
                {block("h-8 w-1/2")}
                {block("h-48 w-full")}
              </>,
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">{cards(3)}</div>
        )}
      </>
    );
  }
  return (
    <div
      role="status"
      aria-label={`Loading ${view} page`}
      className="site-container py-10"
    >
      <span className="sr-only">Loading {view} page�</span>
      <div aria-hidden="true" className="grid gap-6 motion-safe:animate-pulse">
        {content}
      </div>
    </div>
  );
}
