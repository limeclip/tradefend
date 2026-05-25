"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthState = {
  error?: string;
  success?: string;
};

type AuthFormProps = {
  title: string;
  description: string;
  submitText: string;
  switchText: string;
  switchHref: string;
  switchCta: string;
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  googleAction: () => Promise<void>;
  showFullName?: boolean;
  showForgotPassword?: boolean;
};

const initialState: AuthState = {};

export function AuthForm({
  title,
  description,
  submitText,
  switchText,
  switchHref,
  switchCta,
  action,
  googleAction,
  showFullName = false,
  showForgotPassword = false,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.success) {
    return (
      <Card className="w-full max-w-md border-zinc-200/80 shadow-none">
        <CardHeader className="space-y-2 px-8 pt-8">
          <CardTitle className="text-2xl font-semibold tracking-tight">Check your email</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            {title === "Reset password"
              ? "We sent a password reset link to your inbox."
              : "We sent a confirmation link to your inbox. Click the link to verify your account and continue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {title === "Reset password" ? (
              <>Follow the link to create a new password, then you can <Link href="/login" className="font-medium text-foreground hover:underline">sign in</Link>.</>
            ) : (
              <>After verification, you can <Link href="/login" className="font-medium text-foreground hover:underline">sign in</Link>.</>
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-zinc-200/80 shadow-none">
      <CardHeader className="space-y-2 px-8 pt-8">
        <CardTitle className="text-2xl font-semibold tracking-tight">{title}</CardTitle>
        <CardDescription className="text-zinc-500 dark:text-zinc-400">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 px-8 pb-8">
        <form action={formAction} className="space-y-4">
        {showFullName && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Alex Johnson"
                required
                className="h-11"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              required
              className="h-11"
            />
          </div>
         
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div><Label htmlFor="password">Password</Label></div>
              <div>  
                {showForgotPassword && (
                <div className="text-right">
                  <Link href="/forgot-password" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-foreground hover:underline">
                    Forgot password?
                  </Link>
                </div>
              )}
              </div>
            </div>

            <Input id="password" name="password" type="password" required minLength={8} className="h-11" />
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button type="submit" className="h-11 w-full rounded-xl cursor-pointer" disabled={pending}>
            {pending ? "Please wait..." : submitText}
          </Button>
        </form>

        {googleAction && (
          <form action={googleAction}>
            <Button type="submit" variant="outline" className="h-11 w-full rounded-xl cursor-pointer">
              Continue with Google
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          {switchText}{" "}
          <Link href={switchHref} className="font-medium text-foreground hover:underline">
            {switchCta}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}