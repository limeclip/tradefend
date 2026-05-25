import { AuthForm } from "@/components/auth/auth-form";

import { loginWithPassword, signInWithGoogle } from "../actions";

export default function LoginPage() {
  return (
    <AuthForm
      title="Welcome back"
      description="Sign in to access your pre-trade risk workspace."
      submitText="Sign in"
      switchText="Need an account?"
      switchHref="/register"
      switchCta="Create one"
      action={loginWithPassword}
      googleAction={signInWithGoogle}
      showForgotPassword={true}
    />
  );
}
