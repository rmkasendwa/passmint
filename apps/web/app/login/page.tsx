import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
import { AuthFrame } from "../../components/auth-frame";
import { LoginForm } from "../../components/auth-forms";

export default function LoginPage() {
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
