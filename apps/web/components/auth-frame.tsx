import type { ReactNode } from "react";

const sectionKicker =
  "mb-2 text-[0.78rem] font-[var(--weight-semibold)] uppercase tracking-[0.08em] text-[#fa5b2d]";

export function AuthFrame({
  children,
  description,
  kicker,
  pageClass,
  title,
}: {
  children: ReactNode;
  description: string;
  kicker?: string;
  pageClass: string;
  title: string;
}) {
  return (
    <section
      className={`grid min-h-[calc(100vh-64px)] grid-cols-[minmax(0,1fr)_minmax(390px,520px)] bg-[var(--surface)] ${pageClass} max-[820px]:grid-cols-1 max-[820px]:min-h-0`}
    >
      <div
        className="relative min-h-[calc(100vh-64px)] overflow-hidden max-[820px]:h-auto max-[820px]:min-h-[265px] after:absolute after:inset-0 after:bg-[var(--auth-media-overlay)]"
        aria-hidden="true"
      >
        <img
          className="absolute inset-0 size-full object-cover"
          src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1800&q=85"
          alt=""
        />
        <div className="absolute bottom-0 right-0 z-[1] grid w-[min(560px,78%)] gap-2 bg-[var(--auth-media-card-bg)] px-10 pb-10 pt-20 text-white max-[820px]:left-0 max-[820px]:right-0 max-[820px]:w-full max-[820px]:px-[18px] max-[820px]:pb-[18px] max-[820px]:pt-[52px]">
          <span className="text-[0.8rem] font-[var(--weight-semibold)] uppercase tracking-[0.18em] text-[rgb(255_255_255/70%)]">
            Passmint
          </span>
          <strong className="text-[clamp(1.75rem,4vw,3.4rem)] font-[var(--weight-bold)] leading-[0.98] max-[820px]:text-[1.1rem]">
            One account for tickets, events, and the door.
          </strong>
          <small className="max-w-[410px] text-[0.98rem] leading-[1.55] text-[rgb(255_255_255/72%)] max-[820px]:hidden">
            Checkout, hosting, and gate verification in one place.
          </small>
        </div>
      </div>

      <section
        className="grid content-center gap-6 border-l border-[var(--border)] bg-[var(--surface-raised)] px-[clamp(22px,5vw,54px)] py-12 max-[820px]:gap-[19px] max-[820px]:border-l-0 max-[820px]:px-[18px] max-[820px]:pb-[42px] max-[820px]:pt-[30px]"
        aria-label="Account access"
      >
        <div className="grid w-full max-w-[430px] gap-2.5 max-[820px]:max-w-none">
          {kicker && <p className={sectionKicker}>{kicker}</p>}
          <h1 className="mb-0 text-[clamp(2.7rem,7vw,5.6rem)] font-[var(--weight-bold)] leading-[0.95] tracking-normal text-[var(--text)] max-[820px]:text-[clamp(2rem,10vw,2.8rem)]">
            {title}
          </h1>
          <p className="mb-0 text-[1.02rem] leading-[1.58] text-[var(--text-muted)]">
            {description}
          </p>
        </div>

        {children}
      </section>
    </section>
  );
}
