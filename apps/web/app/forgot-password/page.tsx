import { AuthFrame } from "../../components/auth-frame";
import { ForgotPasswordForm } from "../../components/auth-forms";

export default function ForgotPasswordPage() {
  return (
    <AuthFrame
      pageClass="forgot-password"
      kicker="Password reset"
      title="Reset your password."
      description="Enter the email you use for Passmint. We will prepare the next step."
    >
      <ForgotPasswordForm />
    </AuthFrame>
  );
}
