import { AuthFrame } from "../../components/auth-frame";
import { ResetPasswordForm } from "../../components/auth-forms";

export default function ResetPasswordPage() {
  return (
    <AuthFrame
      pageClass="reset-password"
      kicker="New password"
      title="Choose a new password."
      description="Use at least eight characters to keep your tickets and host tools protected."
    >
      <ResetPasswordForm />
    </AuthFrame>
  );
}
