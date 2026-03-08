"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.includes("@")) return;
    await authService.forgotPassword(email);
    setSuccess(true);
  };

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mx-auto max-w-md border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">Forgot password</h1>
          <p className="mt-1 text-sm text-muted-foreground">We will send a password reset link to your email.</p>

          {!success ? (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Email address</label>
                <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              </div>
              <Button className="w-full">Send reset link</Button>
            </form>
          ) : (
            <div className="mt-6 border border-border bg-muted/20 p-4 text-sm">
              Reset link sent successfully. Please check your inbox.
            </div>
          )}

          <p className="mt-4 text-sm text-muted-foreground">
            <Link href="/login" className="underline">Back to login</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
