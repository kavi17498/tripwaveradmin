"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/feedback/toast-provider";
import { authService } from "@/lib/services/authService";
import { UserRole } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("traveler");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Name should have at least 2 characters.");
    if (!email.includes("@")) return setError("Please enter a valid email.");
    if (password.length < 8) return setError("Password should be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await authService.register({ name, email, password, role });
      pushToast({ type: "success", title: "Account created", description: "Your TripWaver account is ready." });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await authService.loginWithGoogle();
      pushToast({ type: "success", title: "Google signup successful", description: "Your account is ready." });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google signup failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mx-auto max-w-lg border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">Register</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create your account to manage trips and bookings.</p>
          <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Full name</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Password</label>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Confirm password</label>
                <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Primary role</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="h-9 w-full border border-input bg-background px-3 text-sm"
              >
                <option value="traveler">Traveler</option>
                <option value="organizer">Organizer</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">Organizers can apply for verification to publish public trips.</p>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full" disabled={loading}>{loading ? "Creating account..." : "Create account"}</Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={googleLoading}>
              {googleLoading ? "Connecting..." : "Sign up with Google"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="underline">Login</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
