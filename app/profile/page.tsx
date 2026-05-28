"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Mail, ShieldCheck, UserCircle2, Plus, Trash2, Globe, Image as ImageIcon, Link as LinkIcon, Facebook, Instagram, Twitter, Linkedin, Award } from "lucide-react";
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
  const [newLanguage, setNewLanguage] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newSpecialization, setNewSpecialization] = useState("");

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
      languagesSpoken: profile.languagesSpoken || [],
      socialLinks: profile.socialLinks || {},
      tripPhotos: profile.tripPhotos || [],
      coverImage: profile.coverImage || "",
      website: profile.website || "",
      specializations: profile.specializations || [],
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

                  {profile.isVerified && (
                    <div className="border-t border-border pt-6 mt-6 space-y-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <ShieldCheck className="size-5 text-emerald-500" />
                        <h3 className="text-base font-bold text-foreground">Verified Guide Settings</h3>
                      </div>
                      
                      {/* Cover Image Upload / Input */}
                      <div className="space-y-3">
                        <label className="text-sm font-semibold flex items-center gap-1.5">
                          <ImageIcon className="size-4 text-primary" /> Cover Image Banner
                        </label>
                        <div className="relative h-40 w-full rounded-lg overflow-hidden border border-border bg-muted/30">
                          {profile.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.coverImage} alt="Cover Preview" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs font-medium">
                              No custom cover image set. Default Sri Lanka landscape banner will be displayed.
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              id="cover-image-upload"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    setSaving(true);
                                    const uploadedUrl = await userImageUploadService.uploadProfileImage(file);
                                    if (uploadedUrl) {
                                      setProfile(curr => curr ? { ...curr, coverImage: uploadedUrl } : null);
                                      pushToast({ type: "success", title: "Cover Image Uploaded", description: "Save profile to persist changes." });
                                    }
                                  } catch (err: any) {
                                    pushToast({ type: "error", title: "Upload Failed", description: err.message });
                                  } finally {
                                    setSaving(false);
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto font-bold cursor-pointer"
                              onClick={() => document.getElementById("cover-image-upload")?.click()}
                            >
                              Upload File
                            </Button>
                          </div>
                          <Input
                            type="text"
                            placeholder="Or paste cover image URL (e.g. https://images.unsplash.com/...)"
                            value={profile.coverImage || ""}
                            onChange={(e) => handleChange("coverImage", e.target.value)}
                            className="flex-1 h-9"
                          />
                        </div>
                      </div>

                      {/* Website URL */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-1.5">
                          <Globe className="size-4 text-primary" /> Guide Website URL
                        </label>
                        <Input
                          type="url"
                          placeholder="https://example.com"
                          value={profile.website || ""}
                          onChange={(e) => handleChange("website", e.target.value)}
                        />
                      </div>
                      
                      {/* Languages Spoken Checklist & Add Custom */}
                      <div className="space-y-3">
                        <label className="text-sm font-semibold flex items-center gap-1.5">
                          <Globe className="size-4 text-primary" /> Languages Spoken
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-3 rounded-lg border border-border bg-muted/10">
                          {["English", "Sinhala", "Tamil", "German", "French", "Spanish", "Italian", "Russian", "Chinese", "Japanese"].map((lang) => {
                            const isChecked = (profile.languagesSpoken || []).includes(lang);
                            return (
                              <label key={lang} className="flex items-center gap-2 text-sm font-medium cursor-pointer hover:text-primary transition-colors">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentLangs = profile.languagesSpoken || [];
                                    const updated = e.target.checked
                                      ? [...currentLangs, lang]
                                      : currentLangs.filter((l) => l !== lang);
                                    setProfile(curr => curr ? { ...curr, languagesSpoken: updated } : null);
                                  }}
                                  className="rounded border-input text-primary focus:ring-ring"
                                />
                                {lang}
                              </label>
                            );
                          })}
                        </div>
                        
                        {/* Add Custom Language */}
                        <div className="flex gap-2 max-w-md">
                          <Input
                            type="text"
                            placeholder="Add other language (e.g. Arabic)"
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (newLanguage.trim() && !(profile.languagesSpoken || []).includes(newLanguage.trim())) {
                                  setProfile(curr => curr ? { ...curr, languagesSpoken: [...(curr.languagesSpoken || []), newLanguage.trim()] } : null);
                                  setNewLanguage("");
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="font-bold cursor-pointer"
                            onClick={() => {
                              if (newLanguage.trim() && !(profile.languagesSpoken || []).includes(newLanguage.trim())) {
                                setProfile(curr => curr ? { ...curr, languagesSpoken: [...(curr.languagesSpoken || []), newLanguage.trim()] } : null);
                                setNewLanguage("");
                              }
                            }}
                          >
                            <Plus className="size-4 mr-1" /> Add
                          </Button>
                        </div>

                        {/* Current languages tags */}
                        {(profile.languagesSpoken || []).length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {(profile.languagesSpoken || []).map((lang) => (
                              <span key={lang} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
                                {lang}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProfile(curr => curr ? { ...curr, languagesSpoken: (curr.languagesSpoken || []).filter(l => l !== lang) } : null);
                                  }}
                                  className="text-muted-foreground hover:text-destructive transition-colors font-black text-sm"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Guide Specializations */}
                      <div className="space-y-3">
                        <label className="text-sm font-semibold flex items-center gap-1.5">
                          <Award className="size-4 text-primary" /> Guide Specializations
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 rounded-lg border border-border bg-muted/10">
                          {["Cultural Heritage", "Family Expeditions", "Solo Safe Anchors", "Wildlife & Safari", "Adventure & Trekking", "Surfing & Water Sports", "Wellness & Yoga", "Food & Culinary"].map((spec) => {
                            const isChecked = (profile.specializations || []).includes(spec);
                            return (
                              <label key={spec} className="flex items-center gap-2 text-sm font-medium cursor-pointer hover:text-primary transition-colors">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentSpecs = profile.specializations || [];
                                    const updated = e.target.checked
                                      ? [...currentSpecs, spec]
                                      : currentSpecs.filter((s) => s !== spec);
                                    setProfile(curr => curr ? { ...curr, specializations: updated } : null);
                                  }}
                                  className="rounded border-input text-primary focus:ring-ring"
                                />
                                {spec}
                              </label>
                            );
                          })}
                        </div>
                        
                        {/* Add Custom Specialization */}
                        <div className="flex gap-2 max-w-md">
                          <Input
                            type="text"
                            placeholder="Add other specialization (e.g. Photography)"
                            value={newSpecialization}
                            onChange={(e) => setNewSpecialization(e.target.value)}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (newSpecialization.trim() && !(profile.specializations || []).includes(newSpecialization.trim())) {
                                  setProfile(curr => curr ? { ...curr, specializations: [...(curr.specializations || []), newSpecialization.trim()] } : null);
                                  setNewSpecialization("");
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="font-bold cursor-pointer"
                            onClick={() => {
                              if (newSpecialization.trim() && !(profile.specializations || []).includes(newSpecialization.trim())) {
                                setProfile(curr => curr ? { ...curr, specializations: [...(curr.specializations || []), newSpecialization.trim()] } : null);
                                setNewSpecialization("");
                              }
                            }}
                          >
                            <Plus className="size-4 mr-1" /> Add
                          </Button>
                        </div>

                        {/* Current Specializations tags */}
                        {(profile.specializations || []).length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {(profile.specializations || []).map((spec) => (
                              <span key={spec} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
                                {spec}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProfile(curr => curr ? { ...curr, specializations: (curr.specializations || []).filter(s => s !== spec) } : null);
                                  }}
                                  className="text-muted-foreground hover:text-destructive transition-colors font-black text-sm"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Social Media Links */}
                      <div className="space-y-4">
                        <label className="text-sm font-semibold flex items-center gap-1.5">
                          <LinkIcon className="size-4 text-primary" /> Social Media Links
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              <Facebook className="size-3.5 text-blue-600" /> Facebook
                            </label>
                            <Input
                              type="url"
                              placeholder="https://facebook.com/username"
                              value={profile.socialLinks?.facebook || ""}
                              onChange={(e) => {
                                setProfile(curr => {
                                  if (!curr) return null;
                                  return {
                                    ...curr,
                                    socialLinks: {
                                      ...(curr.socialLinks || {}),
                                      facebook: e.target.value
                                    }
                                  };
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              <Instagram className="size-3.5 text-pink-500" /> Instagram
                            </label>
                            <Input
                              type="url"
                              placeholder="https://instagram.com/username"
                              value={profile.socialLinks?.instagram || ""}
                              onChange={(e) => {
                                setProfile(curr => {
                                  if (!curr) return null;
                                  return {
                                    ...curr,
                                    socialLinks: {
                                      ...(curr.socialLinks || {}),
                                      instagram: e.target.value
                                    }
                                  };
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              <Twitter className="size-3.5 text-sky-500" /> Twitter / X
                            </label>
                            <Input
                              type="url"
                              placeholder="https://twitter.com/username"
                              value={profile.socialLinks?.twitter || ""}
                              onChange={(e) => {
                                setProfile(curr => {
                                  if (!curr) return null;
                                  return {
                                    ...curr,
                                    socialLinks: {
                                      ...(curr.socialLinks || {}),
                                      twitter: e.target.value
                                    }
                                  };
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              <Linkedin className="size-3.5 text-blue-700" /> LinkedIn
                            </label>
                            <Input
                              type="url"
                              placeholder="https://linkedin.com/in/username"
                              value={profile.socialLinks?.linkedin || ""}
                              onChange={(e) => {
                                setProfile(curr => {
                                  if (!curr) return null;
                                  return {
                                    ...curr,
                                    socialLinks: {
                                      ...(curr.socialLinks || {}),
                                      linkedin: e.target.value
                                    }
                                  };
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Past Trips Photos Gallery */}
                      <div className="space-y-3">
                        <label className="text-sm font-semibold flex items-center gap-1.5">
                          <ImageIcon className="size-4 text-primary" /> Past Organized Trip Gallery
                        </label>
                        
                        {/* Previews */}
                        {(profile.tripPhotos || []).length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-muted/5 p-3 rounded-lg border border-border">
                            {(profile.tripPhotos || []).map((photoUrl, idx) => (
                              <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-border group shadow-xs">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photoUrl} alt={`Trip Photo ${idx + 1}`} className="h-full w-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProfile(curr => curr ? { ...curr, tripPhotos: (curr.tripPhotos || []).filter((_, i) => i !== idx) } : null);
                                  }}
                                  className="absolute top-1.5 right-1.5 bg-black/80 hover:bg-destructive text-white size-6 rounded-full flex items-center justify-center transition-colors font-bold shadow-xs cursor-pointer"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic bg-muted/10 p-3 rounded-lg border border-border">No photos added to your trip gallery yet.</p>
                        )}

                        {/* Add Photo controls */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              id="gallery-image-upload"
                              className="hidden"
                              multiple
                              onChange={async (e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length > 0) {
                                  try {
                                    setSaving(true);
                                    const uploadedUrls: string[] = [];
                                    for (const file of files) {
                                      const url = await userImageUploadService.uploadProfileImage(file);
                                      if (url) uploadedUrls.push(url);
                                    }
                                    if (uploadedUrls.length > 0) {
                                      setProfile(curr => curr ? { ...curr, tripPhotos: [...(curr.tripPhotos || []), ...uploadedUrls] } : null);
                                      pushToast({ type: "success", title: "Images Uploaded", description: `Successfully uploaded ${uploadedUrls.length} image(s).` });
                                    }
                                  } catch (err: any) {
                                    pushToast({ type: "error", title: "Upload Failed", description: err.message });
                                  } finally {
                                    setSaving(false);
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto font-bold cursor-pointer"
                              onClick={() => document.getElementById("gallery-image-upload")?.click()}
                            >
                              Upload Image Files
                            </Button>
                          </div>
                          <div className="flex flex-1 gap-2">
                            <Input
                              type="text"
                              placeholder="Or paste photo URL"
                              value={newPhotoUrl}
                              onChange={(e) => setNewPhotoUrl(e.target.value)}
                              className="h-9"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (newPhotoUrl.trim()) {
                                    setProfile(curr => curr ? { ...curr, tripPhotos: [...(curr.tripPhotos || []), newPhotoUrl.trim()] } : null);
                                    setNewPhotoUrl("");
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="font-bold cursor-pointer"
                              onClick={() => {
                                if (newPhotoUrl.trim()) {
                                  setProfile(curr => curr ? { ...curr, tripPhotos: [...(curr.tripPhotos || []), newPhotoUrl.trim()] } : null);
                                  setNewPhotoUrl("");
                                }
                              }}
                            >
                              <Plus className="size-4 mr-1" /> Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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

              {profile?.isVerified && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 font-bold cursor-pointer text-xs"
                  onClick={() => {
                    const link = `${window.location.origin}/organizers/${profile.id}`;
                    navigator.clipboard.writeText(link);
                    pushToast({
                      type: "success",
                      title: "Link Copied",
                      description: "Guide public profile link copied to clipboard."
                    });
                  }}
                >
                  <LinkIcon className="size-3.5" />
                  Copy Link to Profile
                </Button>
              )}

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
                    {!profile?.isVerified ? (
                      <div className="mt-2">
                        <Button asChild>
                          <Link href="/dashboard/verification">Apply for verification</Link>
                        </Button>
                      </div>
                    ) : null}
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
