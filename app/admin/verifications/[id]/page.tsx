"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/common/modal";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import {
  adminVerificationService,
  AdminVerificationReviewDetails,
} from "@/lib/services/adminVerificationService";
import { formatDateLabel, formatFirestoreTimestamp } from "@/lib/utils";

export default function AdminVerificationReviewDetailPage() {
  const params = useParams<{ id: string }>();
  const verificationId = params?.id;

  const [details, setDetails] = useState<AdminVerificationReviewDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [summary, setSummary] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const loadDetails = useCallback(async () => {
    if (!verificationId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await adminVerificationService.getReviewDetails(verificationId);
      setDetails(response);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load verification review details.");
    } finally {
      setLoading(false);
    }
  }, [verificationId]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  const hasMeeting = useMemo(() => Boolean(details?.meeting?.mailSentAt || details?.meeting?.scheduledAt), [details]);
  const hasSummary = useMemo(() => Boolean(details?.meeting?.meetingSummary?.trim()), [details]);
  const isFinalized = details?.verification?.status === "approved" || details?.verification?.status === "rejected";

  const handleCreateMeeting = async () => {
    if (!verificationId) return;
    if (!meetingDate || !meetingTime) {
      setError("Select date and time for the verification meeting.");
      return;
    }

    const scheduledAt = new Date(`${meetingDate}T${meetingTime}`).toISOString();
    setActionLoading(true);
    setError(null);
    try {
      await adminVerificationService.createMeeting(verificationId, scheduledAt);
      setMeetingModalOpen(false);
      await loadDetails();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create verification meeting.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitSummary = async () => {
    if (!verificationId) return;
    if (!summary.trim()) {
      setError("Meeting summary is required.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await adminVerificationService.submitMeetingSummary(verificationId, summary.trim());
      setSummaryModalOpen(false);
      setSummary("");
      await loadDetails();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to submit meeting summary.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetGuideRole = async () => {
    if (!details?.user?.id) return;

    setActionLoading(true);
    setError(null);
    try {
      await adminVerificationService.assignGuideRole(details.user.id);
      await adminVerificationService.approveVerification(verificationId as string);
      await loadDetails();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to set guide role.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectVerification = async () => {
    if (!verificationId) return;
    if (!rejectionReason.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await adminVerificationService.rejectVerification(verificationId, rejectionReason.trim());
      setRejectModalOpen(false);
      setRejectionReason("");
      await loadDetails();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to reject verification request.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading verification details...</div>;
  }

  if (!details) {
    return <div className="p-6 text-sm text-muted-foreground">Verification details not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Verification Review Details</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review submitted verification data, user profile, and all user-created trips.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/verifications">Back to list</Link>
        </Button>
      </div>

      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      <section className="space-y-3 border border-border p-4">
        <h2 className="text-lg font-semibold">Verification Submission</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <p><span className="font-medium">Request ID:</span> {details.verification.id}</p>
          <p><span className="font-medium">Status:</span> <StatusBadge status={details.verification.status} /></p>
          <p><span className="font-medium">User ID:</span> {details.verification.userId}</p>
          <p><span className="font-medium">Created:</span> {formatFirestoreTimestamp(details.verification.createdAt ?? null)}</p>
          <p><span className="font-medium">Guide License:</span> <a className="text-primary underline" href={details.verification.sltdaGuideLicense} target="_blank" rel="noreferrer">Open file</a></p>
          <p><span className="font-medium">NIC Front:</span> <a className="text-primary underline" href={details.verification.nicImageFront} target="_blank" rel="noreferrer">Open file</a></p>
          <p><span className="font-medium">NIC Back:</span> <a className="text-primary underline" href={details.verification.nicImageBack} target="_blank" rel="noreferrer">Open file</a></p>
          <p><span className="font-medium">Business Name:</span> {(details.verification as any).registeredBusinessName || "-"}</p>
        </div>
      </section>

      <section className="space-y-3 border border-border p-4">
        <h2 className="text-lg font-semibold">User Details</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <p><span className="font-medium">Name:</span> {`${details.user.firstName || ""} ${details.user.lastName || ""}`.trim() || "-"}</p>
          <p><span className="font-medium">Email:</span> {details.user.email || "-"}</p>
          <p><span className="font-medium">Phone:</span> {details.user.phone || "-"}</p>
          <p><span className="font-medium">Address:</span> {`${(details.user as any).street || ""}, ${(details.user as any).city || ""}, ${(details.user as any).country || ""}`.replace(/^\s*,\s*|\s*,\s*$/g, "") || "-"}</p>
          <p><span className="font-medium">Role:</span> {(details.user as any).role || "-"}</p>
          <p><span className="font-medium">Is Verified:</span> {(details.user as any).isVerified ? "Yes" : "No"}</p>
        </div>
      </section>

      <section className="space-y-3 border border-border p-4">
        <h2 className="text-lg font-semibold">Trips Created By User (Including Private)</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="p-3 text-left font-medium">Trip Name</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Start</th>
                <th className="p-3 text-left font-medium">End</th>
                <th className="p-3 text-left font-medium">Location</th>
              </tr>
            </thead>
            <tbody>
              {details.trips.map((trip) => (
                <tr key={trip.id} className="border-t border-border">
                  <td className="p-3">{trip.tripName || "-"}</td>
                  <td className="p-3"><StatusBadge status={trip.status || "pending"} /></td>
                  <td className="p-3">{trip.startDate ? formatDateLabel(String(trip.startDate)) : "-"}</td>
                  <td className="p-3">{trip.endDate ? formatDateLabel(String(trip.endDate)) : "-"}</td>
                  <td className="p-3">{trip.startLocation || "-"}</td>
                </tr>
              ))}
              {!details.trips.length ? (
                <tr>
                  <td className="p-4 text-center text-muted-foreground" colSpan={5}>
                    No trips created by this user.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 border border-border p-4">
        <h2 className="text-lg font-semibold">Verification Workflow</h2>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setMeetingModalOpen(true)} disabled={actionLoading}>
            Send verification meeting mail
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSummaryModalOpen(true)}
            disabled={actionLoading || !hasMeeting}
          >
            Submit meeting summary
          </Button>
          <Button type="button" onClick={() => void handleSetGuideRole()} disabled={actionLoading || !hasSummary}>
            Set guide role
          </Button>
          <Button type="button" variant="destructive" onClick={() => setRejectModalOpen(true)} disabled={actionLoading || isFinalized}>
            Reject
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Step order: create meeting first, then submit summary, then set guide role.
        </p>
      </section>

      <Modal
        open={meetingModalOpen}
        title="Schedule Verification Meeting"
        description="Select date and time to create the verification meeting mail record."
        onClose={() => setMeetingModalOpen(false)}
        onConfirm={() => void handleCreateMeeting()}
        confirmText="Submit"
      >
        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm">
            Date
            <input
              className="mt-1 w-full border border-border bg-background px-3 py-2"
              type="date"
              value={meetingDate}
              onChange={(event) => setMeetingDate(event.target.value)}
            />
          </label>
          <label className="text-sm">
            Time
            <input
              className="mt-1 w-full border border-border bg-background px-3 py-2"
              type="time"
              value={meetingTime}
              onChange={(event) => setMeetingTime(event.target.value)}
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={summaryModalOpen}
        title="Submit Meeting Summary"
        description="Enter meeting summary to continue verification workflow."
        onClose={() => setSummaryModalOpen(false)}
        onConfirm={() => void handleSubmitSummary()}
        confirmText="Submit"
      >
        <label className="text-sm">
          Meeting summary
          <textarea
            className="mt-1 min-h-28 w-full border border-border bg-background px-3 py-2"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
          />
        </label>
      </Modal>

      <Modal
        open={rejectModalOpen}
        title="Reject Verification Request"
        description="Provide a reason so the request creator can be notified."
        onClose={() => setRejectModalOpen(false)}
        onConfirm={() => void handleRejectVerification()}
        confirmText="Reject"
      >
        <label className="text-sm">
          Rejection reason
          <textarea
            className="mt-1 min-h-28 w-full border border-border bg-background px-3 py-2"
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
          />
        </label>
      </Modal>
    </div>
  );
}
