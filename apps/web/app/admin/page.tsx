import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireServerSession } from "../../server-session";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await requireServerSession("/admin");
  if (session.user.role !== "admin" && session.user.role !== "root_admin") notFound();

  return (
    <div className="mx-auto w-[min(1120px,calc(100%-32px))] py-10">
      <header className="border-b border-border pb-6">
        <p className="mb-2 text-xs font-semibold uppercase text-accent">Platform administration</p>
        <h1 className="text-3xl font-bold text-text">Administration</h1>
      </header>
    </div>
  );
}
