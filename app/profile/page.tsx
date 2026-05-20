"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Mail, ShieldCheck, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/feedback/toast-provider";
import { authService } from "@/lib/services/authService";
import { userService, type UserProfileRecord, type UpdateUserProfilePayload } from "@/lib/services/userService";
import { useAuthCacheStore } from "@/lib/stores/useAuthCacheStore";
import { userSessionService } from "@/lib/services/userSessionService";
import { userImageUploadService } from "@/lib/services/userImageUploadService";
import AvatarUpload from "@/components/common/avatar-upload";

const toDateLabel = (value?: { _seconds: number; _nanoseconds: number } | string | null) => {
  if (!value) return "Unknown";
  if (typeof value === "string") return value;
  return new Date(value._seconds * 1000 + Math.floor(value._nanoseconds / 1_000_000)).toLocaleString();
};

const profileFields: Array<{
  key: keyof UpdateUserProfilePayload;
  label: string;
  placeholder: string;
  type?: string;
}> = [
  { key: "profileImage", label: "Profile image URL", placeholder: "https://example.com/profile.jpg" },
  { key: "firstName", label: "First name", placeholder: "Enter first name" },
  { key: "lastName", label: "Last name", placeholder: "Enter last name" },
  { key: "phone", label: "Phone", placeholder: "Enter phone number" },
  { key: "bio", label: "Bio", placeholder: "Tell people about yourself" },
  { key: "street", label: "Street", placeholder: "Enter street address" },
  { key: "city", label: "City", placeholder: "Enter city" },
  { key: "state", label: "State", placeholder: "Enter state" },
  { key: "postalCode", label: "Postal code", placeholder: "Enter postal code" },
  { key: "country", label: "Country", placeholder: "Enter country" },
  { key: "dateOfBirth", label: "Date of birth", placeholder: "YYYY-MM-DD", type: "date" },
  { key: "gender", label: "Gender", placeholder: "Select gender" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const { currentUser, token, hydrated, hydrateFromLegacySession } = useAuthCacheStore();
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sessionUserId = useMemo(() => currentUser?.id ?? null, [currentUser?.id]);

  useEffect(() => {
    hydrateFromLegacySession();
  }, [hydrateFromLegacySession]);

  useEffect(() => {
    if (!hydrated) return;

    const loadProfile = async () => {
      if (!sessionUserId || !token) {
        setError("Please sign in to view your profile.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await userService.getUserProfileById(sessionUserId, token);
        setProfile(response.data);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [hydrated, sessionUserId, token]);

  const handleChange = (field: keyof UpdateUserProfilePayload, value: string) => {
    setProfile((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleFileChange = (file?: File | null) => {
    setSelectedFile(file ?? null);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setProfile((current) => (current ? { ...current, profileImage: url } : current));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile || !sessionUserId || !token) return;

    setSaving(true);
    setError("");

    const payload: UpdateUserProfilePayload = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      profileImage: profile.profileImage,
      bio: profile.bio,
      street: profile.street,
      city: profile.city,
      state: profile.state,
      postalCode: profile.postalCode,
      country: profile.country,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender as UpdateUserProfilePayload["gender"],
    };

    try {
      // if a new file is selected, upload it and replace profileImage with the uploaded URL
      if (selectedFile) {
        const uploaded = await userImageUploadService.uploadProfileImage(selectedFile);
        if (uploaded) payload.profileImage = uploaded;
      }
      const response = await userService.updateUserProfile(sessionUserId, payload, token);
      setProfile(response.data);
      if (currentUser) {
        useAuthCacheStore.getState().setSession({ ...currentUser, ...response.data }, token);
      }
      userSessionService.saveUserProfile(response.data);
      pushToast({ type: "success", title: "Profile updated", description: "Your changes were saved successfully." });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/30">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>

        <section className="relative overflow-hidden border border-border bg-card shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-slate-400 to-emerald-500" />
          <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
            <div className="space-y-6">
              <PageHeader
                title="Profile"
                description="Update your account details and keep your profile information current."
              />

              {loading ? <p className="text-sm text-muted-foreground">Loading profile...</p> : null}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              {profile ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    {profileFields.map((field) => (
                      <div key={String(field.key)} className="space-y-2">
                        <label className="text-sm font-medium">{field.label}</label>
                        {field.key === "profileImage" ? (
                          <div>
                            <AvatarUpload
                              src={profile.profileImage ?? previewUrl ?? null}
                              editable
                              size={96}
                              onFileSelected={(file) => {
                                setSelectedFile(file);
                                if (file) {
                                  const url = URL.createObjectURL(file);
                                  setPreviewUrl(url);
                                  setProfile((current) => (current ? { ...current, profileImage: url } : current));
                                } else {
                                  setPreviewUrl(null);
                                }
                              }}
                            />
                          </div>
                        ) : field.key === "bio" ? (
                          <textarea
                            value={profile.bio ?? ""}
                            onChange={(event) => handleChange("bio", event.target.value)}
                            placeholder={field.placeholder}
                            className="min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                          />
                        ) : field.key === "dateOfBirth" ? (
                          <Input
                            type="date"
                            value={(profile.dateOfBirth as string | undefined) ?? ""}
                            onChange={(event) => handleChange("dateOfBirth", event.target.value)}
                            placeholder={field.placeholder}
                          />
                        ) : field.key === "gender" ? (
                          <select
                            value={(profile.gender as string | undefined) ?? ""}
                            onChange={(event) => handleChange("gender", event.target.value)}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none"
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        ) : (
                          <Input
                            value={(profile[field.key] as string | undefined) ?? ""}
                            onChange={(event) => handleChange(field.key, event.target.value)}
                            placeholder={field.placeholder}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving changes..." : "Save profile"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.refresh()}>
                      Reset view
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>

            <aside className="space-y-4 border border-border bg-background/70 p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                  {profile?.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.profileImage} alt="profile" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <UserCircle2 className="size-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Signed in as</p>
                  <p className="font-semibold">{profile ? `${profile.firstName} ${profile.lastName}`.trim() : "Unknown user"}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 rounded-md border border-border p-3">
                  <Mail className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">{profile?.email ?? "Hidden"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-md border border-border p-3">
                  <ShieldCheck className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Verification</p>
                    <p className="text-muted-foreground">{profile ? (profile.isVerified ? "Verified" : "Not verified") : "Unknown"}</p>
                  </div>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="font-medium">Gender</p>
                  <p className="text-muted-foreground">{profile?.gender ?? "Unknown"}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="font-medium">Date of birth</p>
                  <p className="text-muted-foreground">{profile ? toDateLabel(profile.dateOfBirth) : "Unknown"}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="font-medium">Created</p>
                  <p className="text-muted-foreground">{profile ? toDateLabel(profile.createdAt) : "Unknown"}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="font-medium">Last updated</p>
                  <p className="text-muted-foreground">{profile ? toDateLabel(profile.updatedAt) : "Unknown"}</p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
