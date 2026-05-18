"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/feedback/toast-provider";
import { useUserRegistrationStore } from "@/lib/stores/useUserRegistrationStore";
import { useAuthCacheStore } from "@/lib/stores/useAuthCacheStore";
import { userSessionService } from "@/lib/services/userSessionService";

export default function RegisterPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const setSession = useAuthCacheStore((state) => state.setSession);
  const { form, loading, googleLoading, error, setField, registerManual, registerWithGoogle, clearError, resetForm } =
    useUserRegistrationStore();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    clearError();

    try {
      await registerManual(password, confirmPassword);
      const profile = userSessionService.getUserProfile<Record<string, unknown>>();
      const token = userSessionService.getToken();
      if (profile && token) {
        setSession(profile, token);
      }
      pushToast({ type: "success", title: "Account created", description: "Your TripWaver account is ready." });
      resetForm();
      setPassword("");
      setConfirmPassword("");
      router.push("/dashboard");
    } catch {}
  };

  const handleGoogleSignup = async () => {
    clearError();
    try {
      await registerWithGoogle();
      const profile = userSessionService.getUserProfile<Record<string, unknown>>();
      const token = userSessionService.getToken();
      if (profile && token) {
        setSession(profile, token);
      }
      pushToast({ type: "success", title: "Google signup successful", description: "Profile submitted successfully." });
      resetForm();
      router.push("/dashboard");
    } catch {}
  };

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mx-auto max-w-2xl border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">Register</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your account and complete your profile details before continuing.
          </p>
          <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">First name</label>
                <Input value={form.firstName} onChange={(event) => setField("firstName", event.target.value)} placeholder="John" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Last name</label>
                <Input value={form.lastName} onChange={(event) => setField("lastName", event.target.value)} placeholder="Doe" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <Input value={form.email} onChange={(event) => setField("email", event.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <Input value={form.phone} onChange={(event) => setField("phone", event.target.value)} placeholder="+1234567890" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Date of birth</label>
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) => setField("dateOfBirth", event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Gender</label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.gender}
                  onChange={(event) => setField("gender", event.target.value as "male" | "female" | "other")}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Profile image URL (optional)</label>
              <Input
                value={form.profileImage}
                onChange={(event) => setField("profileImage", event.target.value)}
                placeholder="https://example.com/profile.jpg"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Bio</label>
              <Input value={form.bio} onChange={(event) => setField("bio", event.target.value)} placeholder="Travel enthusiast" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Street</label>
              <Input value={form.street} onChange={(event) => setField("street", event.target.value)} placeholder="123 Main St" />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">City</label>
                <Input value={form.city ?? ""} onChange={(event) => setField("city", event.target.value)} placeholder="New York" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">State</label>
                <Input value={form.state ?? ""} onChange={(event) => setField("state", event.target.value)} placeholder="NY" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Postal code</label>
                <Input
                  value={form.postalCode ?? ""}
                  onChange={(event) => setField("postalCode", event.target.value)}
                  placeholder="10001"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Country</label>
                <Input value={form.country ?? ""} onChange={(event) => setField("country", event.target.value)} placeholder="USA" />
              </div>
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

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full" disabled={loading || googleLoading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignup} disabled={googleLoading}>
              {googleLoading ? "Connecting..." : "Sign up with Google and submit profile"}
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
