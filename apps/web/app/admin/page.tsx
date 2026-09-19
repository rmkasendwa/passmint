import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPortability } from "../../components/admin-portability";
import { requireServerSession } from "../../server-session";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await requireServerSession("/admin");
  if (session.user.role !== "admin" && session.user.role !== "root_admin") notFound();

  return <AdminPortability />;
}
