"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { formatFirestoreTimestamp } from "@/lib/utils";
import {
  adminVerificationService,
  AdminVerificationRequest,
} from "@/lib/services/adminVerificationService";

export default function AdminVerificationsPage() {
  const [pendingRequests, setPendingRequests] = useState<AdminVerificationRequest[]>([]);
  const [inReviewRequests, setInReviewRequests] = useState<AdminVerificationRequest[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pending, inReview] = await Promise.all([
        adminVerificationService.getPendingRequests(),
        adminVerificationService.getInReviewRequestsAssignedToMe(),
      ]);
      setPendingRequests(pending);
      setInReviewRequests(inReview);
      setSelectedIds((prev) => prev.filter((id) => pending.some((request) => request.id === id)));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load verification requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const handleSelectAllPending = () => {
    setSelectedIds((prev) => {
      if (prev.length === pendingRequests.length) {
        return [];
      }
      return pendingRequests.map((request) => request.id);
    });
  };

  const handleMoveToInReview = async () => {
    if (!selectedIds.length) return;

    setActionLoading(true);
    setError(null);
    try {
      await adminVerificationService.moveToInReview(selectedIds);
      await loadData();
      setSelectedIds([]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to move requests to in-review.");
    } finally {
      setActionLoading(false);
    }
  };

  const allPendingSelected = pendingRequests.length > 0 && selectedIds.length === pendingRequests.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Verifaction Request Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select pending requests and move them into your in-review queue.
        </p>
      </div>

      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Pending Verification Requests</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllPending}
              disabled={loading || !pendingRequests.length}
            >
              {allPendingSelected ? "Clear selection" : "Select all"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleMoveToInReview()}
              disabled={loading || actionLoading || !selectedIds.length}
            >
              Move selected to in-review ({selectedIds.length})
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="p-3 text-left font-medium">Select</th>
                <th className="p-3 text-left font-medium">Request ID</th>
                <th className="p-3 text-left font-medium">User ID</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Guide License</th>
                <th className="p-3 text-left font-medium">NIC Front</th>
                <th className="p-3 text-left font-medium">NIC Back</th>
                <th className="p-3 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((request) => (
                <tr key={request.id} className="border-t border-border">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(request.id)}
                      onChange={() => handleToggle(request.id)}
                      disabled={loading || actionLoading}
                    />
                  </td>
                  <td className="p-3 font-mono text-xs">{request.id}</td>
                  <td className="p-3 font-mono text-xs">{request.userId}</td>
                  <td className="p-3"><StatusBadge status={request.status} /></td>
                  <td className="p-3"><a className="text-primary underline" href={request.sltdaGuideLicense} target="_blank" rel="noreferrer">Open file</a></td>
                  <td className="p-3"><a className="text-primary underline" href={request.nicImageFront} target="_blank" rel="noreferrer">Open file</a></td>
                  <td className="p-3"><a className="text-primary underline" href={request.nicImageBack} target="_blank" rel="noreferrer">Open file</a></td>
                  <td className="p-3">{formatFirestoreTimestamp(request.createdAt ?? null)}</td>
                </tr>
              ))}
              {!pendingRequests.length && !loading ? (
                <tr>
                  <td className="p-4 text-center text-muted-foreground" colSpan={8}>
                    No pending verification requests found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">In-Review Requests Assigned To You</h2>
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="p-3 text-left font-medium">Request ID</th>
                <th className="p-3 text-left font-medium">User ID</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Assigned By</th>
                <th className="p-3 text-left font-medium">Assigned At</th>
                <th className="p-3 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {inReviewRequests.map((request) => (
                <tr key={request.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">
                    <Link href={`/admin/verifications/${request.id}`} className="text-primary underline">
                      {request.id}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-xs">{request.userId}</td>
                  <td className="p-3"><StatusBadge status={request.status} /></td>
                  <td className="p-3">{request.inReviewByName ?? "Admin"}</td>
                  <td className="p-3">{formatFirestoreTimestamp(request.inReviewAssignedAt ?? null)}</td>
                  <td className="p-3">{formatFirestoreTimestamp(request.createdAt ?? null)}</td>
                </tr>
              ))}
              {!inReviewRequests.length && !loading ? (
                <tr>
                  <td className="p-4 text-center text-muted-foreground" colSpan={6}>
                    No in-review requests assigned to you yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
