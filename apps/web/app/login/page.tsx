import { getServerSession } from "../../server-session";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
import { AuthFrame } from "../../components/auth-frame";
import { LoginForm } from "../../components/auth-forms";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getServerSession()) {
    const next = (await searchParams).next;
    redirect(next?.startsWith("/dashboard/") ? next : "/dashboard");
  }
  return (
    <AuthFrame
      pageClass="login"
      title="Welcome back."
      description="Access saved tickets, faster checkout, event publishing, and gate verification."
    >
      <LoginForm />
    </AuthFrame>
  );
}
