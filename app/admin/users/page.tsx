"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/common/modal";
import { SearchInput } from "@/components/common/search-input";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { adminService } from "@/lib/services/adminService";
import { useAdminDataStore } from "@/lib/stores/useAdminDataStore";
import { formatFirestoreTimestamp } from "@/lib/utils";

export default function AdminUsersPage() {
  const { users: adminUsers, fetchUsers, loadingUsers } = useAdminDataStore();
  const [query, setQuery] = useState("");
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(
    () =>
      adminUsers.filter((user) => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const matchQuery = fullName.includes(query.toLowerCase()) || user.email.toLowerCase().includes(query.toLowerCase()) || user.phone.includes(query);
        return matchQuery;
      }),
    [adminUsers, query],
  );

  const handleSetAsUser = async (userId: string) => {
    setActionUserId(userId);
    setActionError(null);

    try {
      await adminService.assignRole(userId, "user");
      await fetchUsers();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to change role to user.");
    } finally {
      setActionUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Search and review platform users loaded from the API.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SearchInput value={query} onChange={setQuery} placeholder="Search users" />
        <div className="flex items-center rounded-md border border-border bg-muted/20 px-3 text-sm text-muted-foreground">
          {loadingUsers ? "Loading users..." : `${filteredUsers.length} users loaded`}
        </div>
      </div>

      {actionError ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{actionError}</p> : null}

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[780px] text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="p-3 text-left font-medium">Name</th>
              <th className="p-3 text-left font-medium">Email</th>
              <th className="p-3 text-left font-medium">Phone</th>
              <th className="p-3 text-left font-medium">Location</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-left font-medium">Created</th>
              <th className="p-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="p-3">{user.firstName} {user.lastName}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.phone}</td>
                <td className="p-3">{user.city}, {user.country}</td>
                <td className="p-3"><StatusBadge status={user.isVerified ? "active" : "pending"} /></td>
                <td className="p-3">{formatFirestoreTimestamp(user.createdAt)}</td>
                <td className="p-3 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingUserId(user.id)}
                    disabled={loadingUsers || actionUserId === user.id}
                  >
                    {actionUserId === user.id ? "Updating..." : "Set as User"}
                  </Button>
                </td>
              </tr>
            ))}
            {!filteredUsers.length ? (
              <tr>
                <td className="p-4 text-center text-muted-foreground" colSpan={7}>
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(pendingUserId)}
        title="Set as User"
        description="Are you sure you want to change this account role to user? This will set isVerified to false and notify the user."
        onClose={() => setPendingUserId(null)}
        onConfirm={() => {
          const userId = pendingUserId;
          setPendingUserId(null);
          if (userId) {
            void handleSetAsUser(userId);
          }
        }}
        confirmText="Yes"
      />
    </div>
  );
}
