import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Organizer workspace",
  robots: { index: false, follow: false },
};
import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/dashboard/events");
}
