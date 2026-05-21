"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/feedback/toast-provider";
import { userImageUploadService } from "@/lib/services/userImageUploadService";
import { verificationApiService } from "@/lib/services/verificationApiService";
import { useEffect } from "react";

export default function OrganizerVerificationPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [status, setStatus] = useState<"not submitted" | "pending" | "approved" | "rejected">("not submitted");

  const [sltdaFile, setSltdaFile] = useState<File | null>(null);
  const [nicFront, setNicFront] = useState<File | null>(null);
  const [nicBack, setNicBack] = useState<File | null>(null);
  const [registeredBusinessName, setRegisteredBusinessName] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await verificationApiService.getMyRequests();
        const items = Array.isArray(res) ? res : (res as any).data ?? (res as any);
        const list = Array.isArray(items) ? items : [];
        if (list.length > 0) {
          const r = list[0];
          setRequestId(r.id ?? null);
          setStatus((r.status as any) ?? 'pending');
          setRegisteredBusinessName(r.registeredBusinessName ?? '');
          setTaxNumber(r.taxOrBusinessRegistrationNumber ?? '');
          setFacebook(r.socialLinks?.facebook ?? '');
          setInstagram(r.socialLinks?.instagram ?? '');
          setYoutube(r.socialLinks?.youtube ?? '');
          setTiktok(r.socialLinks?.tiktok ?? '');
          setLinkedin(r.socialLinks?.linkedin ?? '');
        }
      } catch (e) {
        // ignore silently
      }
    };

    load();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!sltdaFile || !nicFront || !nicBack) {
      setError("Please provide SLTDA license and both NIC images.");
      return;
    }

    setLoading(true);
    try {
      const sltdaUrl = await userImageUploadService.uploadProfileImage(sltdaFile);
      const nicFrontUrl = await userImageUploadService.uploadProfileImage(nicFront);
      const nicBackUrl = await userImageUploadService.uploadProfileImage(nicBack);

      if (!sltdaUrl || !nicFrontUrl || !nicBackUrl) {
        throw new Error("Failed to upload required verification files.");
      }

      const socialLinks = Object.fromEntries(
        Object.entries({
          facebook,
          instagram,
          youtube,
          tiktok,
          linkedin,
        }).filter(([, value]) => value.trim().length > 0),
      );

      const payload = {
        sltdaGuideLicense: sltdaUrl,
        nicImageFront: nicFrontUrl,
        nicImageBack: nicBackUrl,
        registeredBusinessName: registeredBusinessName || undefined,
        taxOrBusinessRegistrationNumber: taxNumber || undefined,
        socialLinks: Object.keys(socialLinks).length ? socialLinks : undefined,
      };

      await verificationApiService.submit(payload);
      setStatus("pending");
      pushToast({ type: "success", title: "Verification submitted", description: "Your verification request is pending review." });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Organizer Verification" description="Submit required documents to publish public trips." />

      <div className="flex items-center gap-2">
        <p className="text-sm">Current status:</p>
        <StatusBadge status={status} />
      </div>

      <section className="space-y-4 border border-border bg-card p-5">
        <h2 className="font-semibold">Verification</h2>

        {/* If a request exists and not editing, show submitted data */}
        {requestId && !editing ? (
          <div className="space-y-3">
            <div>
              <p className="font-medium">Status</p>
              <StatusBadge status={status} />
            </div>
            <div>
              <p className="font-medium">SLTDA Guide License</p>
              <p className="text-sm text-muted-foreground">(uploaded)</p>
            </div>
            <div>
              <p className="font-medium">NIC - Front</p>
              <p className="text-sm text-muted-foreground">(uploaded)</p>
            </div>
            <div>
              <p className="font-medium">NIC - Back</p>
              <p className="text-sm text-muted-foreground">(uploaded)</p>
            </div>
            <div>
              <p className="font-medium">Business name</p>
              <p className="text-sm text-muted-foreground">{registeredBusinessName || '—'}</p>
            </div>
            <div>
              <p className="font-medium">Tax / Business Reg. No.</p>
              <p className="text-sm text-muted-foreground">{taxNumber || '—'}</p>
            </div>

            <div className="flex gap-2">
              {(status === 'pending' || status === 'rejected') && (
                <Button onClick={() => setEditing(true)}>Edit</Button>
              )}
              {status !== 'approved' && (
                <Button variant="outline" onClick={async () => {
                  if (!requestId) return;
                  try {
                    setLoading(true);
                    await verificationApiService.remove(requestId);
                    pushToast({ type: 'success', title: 'Deleted', description: 'Verification request deleted.' });
                    setRequestId(null);
                    setStatus('not submitted');
                  } catch (err: any) {
                    pushToast({ type: 'error', title: 'Failed', description: err?.message || 'Delete failed' });
                  } finally { setLoading(false); }
                }}>Delete</Button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">SLTDA Guide License (image or PDF)</label>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setSltdaFile(e.target.files?.[0] ?? null)} />
          </div>

          <div>
            <label className="block mb-1">NIC Image - Front</label>
            <input type="file" accept="image/*" onChange={(e) => setNicFront(e.target.files?.[0] ?? null)} />
          </div>

          <div>
            <label className="block mb-1">NIC Image - Back</label>
            <input type="file" accept="image/*" onChange={(e) => setNicBack(e.target.files?.[0] ?? null)} />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input placeholder="Registered Business Name (optional)" value={registeredBusinessName} onChange={(e) => setRegisteredBusinessName(e.target.value)} />
            <Input placeholder="Tax / Business Registration Number (optional)" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
          </div>

          <div>
            <label className="block mb-1">Social Links (optional)</label>
            <input placeholder="Facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} className="w-full mb-1" />
            <input placeholder="Instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full mb-1" />
            <input placeholder="YouTube" value={youtube} onChange={(e) => setYoutube(e.target.value)} className="w-full mb-1" />
            <input placeholder="TikTok" value={tiktok} onChange={(e) => setTiktok(e.target.value)} className="w-full mb-1" />
            <input placeholder="LinkedIn" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="w-full" />
          </div>

          {error && <div className="text-red-600">{error}</div>}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? "Submitting..." : (requestId ? "Save changes" : "Submit Verification")}</Button>
            {requestId ? (
              <Button variant="outline" onClick={() => { setEditing(false); }}>
                Cancel
              </Button>
            ) : (
              <Button variant="outline" onClick={() => router.push('/dashboard')}>Cancel</Button>
            )}
          </div>
        </form>
        )}
      </section>
    </div>
  );
}
