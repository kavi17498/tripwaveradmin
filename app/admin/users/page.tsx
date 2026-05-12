"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchInput } from "@/components/common/search-input";
import { StatusBadge } from "@/components/common/status-badge";
import { useAdminDataStore } from "@/lib/stores/useAdminDataStore";
import { formatFirestoreTimestamp } from "@/lib/utils";

export default function AdminUsersPage() {
  const { users: adminUsers, fetchUsers, loadingUsers } = useAdminDataStore();
  const [query, setQuery] = useState("");

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
                <td className="p-3 text-right text-xs text-muted-foreground">
                  Review only
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
    </div>
  );
}
