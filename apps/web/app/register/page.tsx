import { AuthFrame } from "../../components/auth-frame";
import { RegisterForm } from "../../components/auth-forms";

export default function RegisterPage() {
  return (
    <AuthFrame
      pageClass="register"
      kicker="Create account"
      title="Create your account."
      description="Save tickets, publish events, and move guests through the door with less friction."
    >
      <RegisterForm />
    </AuthFrame>
  );
}
