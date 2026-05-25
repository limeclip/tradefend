import { AuthForm } from "@/components/auth/auth-form";
import { registerWithPassword, signInWithGoogle } from "../actions";

export default function RegisterPage() {
  return (
    <AuthForm
      title="Create your account"
      description="Start checking risk before every trade."
      submitText="Create account"
      switchText="Already have an account?"
      switchHref="/login"
      switchCta="Sign in"
      action={registerWithPassword}
      googleAction={signInWithGoogle}
      showFullName={true}   // <--- добавляем
    />
  );
}