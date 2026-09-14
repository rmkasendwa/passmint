import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};
import { AuthFrame } from "../../components/auth-frame";
import { ResetPasswordForm } from "../../components/auth-forms";

export default function ResetPasswordPage() {
  return (
    <AuthFrame
      pageClass="reset-password"
      title="Choose a new password."
      description="Use at least eight characters to keep your tickets and host tools protected."
    >
      <ResetPasswordForm />
    </AuthFrame>
  );
}
