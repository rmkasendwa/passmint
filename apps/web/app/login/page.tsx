import { AuthFrame } from "../../components/auth-frame";
import { LoginForm } from "../../components/auth-forms";

export default function LoginPage() {
  return (
    <AuthFrame
      pageClass="login"
      kicker="Sign in"
      title="Welcome back."
      description="Access saved tickets, faster checkout, event publishing, and gate verification."
    >
      <LoginForm />
    </AuthFrame>
  );
}
