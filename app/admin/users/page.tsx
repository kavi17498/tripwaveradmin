"use client";

import { useMemo, useState } from "react";
import { SearchInput } from "@/components/common/search-input";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { mockUsers } from "@/lib/data/users";

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const users = useMemo(
    () =>
      mockUsers.filter((user) => {
        const matchQuery = user.name.toLowerCase().includes(query.toLowerCase()) || user.email.toLowerCase().includes(query.toLowerCase());
        const matchStatus = statusFilter === "all" ? true : user.status === statusFilter;
        return matchQuery && matchStatus;
      }),
    [query, statusFilter],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Search, filter, and moderate platform users.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search users" />
        <select className="h-9 border border-input bg-background px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[780px] text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="p-3 text-left font-medium">Name</th>
              <th className="p-3 text-left font-medium">Email</th>
              <th className="p-3 text-left font-medium">Role</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3"><StatusBadge status={user.role} /></td>
                <td className="p-3"><StatusBadge status={user.status} /></td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline">Suspend</Button>
                    <Button size="sm" variant="destructive">Deactivate</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
