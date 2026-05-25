"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "../actions";

type ForgotPasswordState = {
  error?: string;
  success?: string;
};

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPassword, initialState);

  if (state.success) {
    return (
      <div className="">
        <Card className="w-full max-w-md border-border/80 shadow-none">
          <CardHeader className="space-y-2 px-8 pt-8">
            <CardTitle className="text-2xl font-semibold tracking-tight">Check your email</CardTitle>
            <CardDescription className="text-zinc-500">
              We sent a password reset link to your inbox.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <p className="text-sm text-zinc-600">
              Follow the link to create a new password, then you can{" "}
              <Link href="/login" className="font-medium text-zinc-950 hover:underline">
                sign in
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="">
      <Card className="w-full max-w-md border-border/80 shadow-none">
        <CardHeader className="space-y-2 px-8 pt-8">
          <CardTitle className="text-2xl font-semibold tracking-tight">Reset password</CardTitle>
          <CardDescription className="text-zinc-500">
            Enter your email and we&apos;ll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-8 pb-8">
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@domain.com"
                required
                className="h-11"
              />
            </div>
            {state.error && <p className="text-sm text-red-600">{state.error}</p>}
            <Button type="submit" className="h-11 w-full rounded-xl cursor-pointer" disabled={pending}>
              {pending ? "Please wait..." : "Send reset link"}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Back to{" "}
            <Link href="/login" className="font-medium text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}