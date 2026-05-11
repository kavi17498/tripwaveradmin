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
import { userService } from "@/lib/services/userService";
import { userSessionService } from "@/lib/services/userSessionService";

export default function LoginPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const resolvePostLoginPath = (role?: string) => (role === "admin" || role === "superadmin" ? "/admin" : "/dashboard");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.includes("@")) return setError("Please enter a valid email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const authResult = await authService.loginForUserModule(email, password);
      const userResult = await userService.getUserProfileById(authResult.data.uid, authResult.data.token);
      userSessionService.saveUserProfile(userResult.data);
      userSessionService.saveToken(authResult.data.token);
      pushToast({ type: "success", title: "Welcome back", description: "You are now logged in." });
      router.push(resolvePostLoginPath((userResult.data as { role?: string }).role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const authResult = await authService.loginWithGoogleForUserModule();
      const userResult = await userService.getUserProfileById(authResult.data.uid, authResult.data.token);
      userSessionService.saveUserProfile(userResult.data);
      userSessionService.saveToken(authResult.data.token);
      pushToast({ type: "success", title: "Google sign in successful", description: "Welcome to TripWaver." });
      router.push(resolvePostLoginPath((userResult.data as { role?: string }).role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mx-auto max-w-md border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">Access your trips and dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>

          <Button variant="outline" className="mt-3 w-full" onClick={handleGoogleLogin} disabled={googleLoading}>
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </Button>
          <div className="mt-4 flex justify-between text-sm">
            <Link className="text-muted-foreground underline" href="/forgot-password">Forgot password?</Link>
            <Link className="text-muted-foreground underline" href="/register">Create account</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
