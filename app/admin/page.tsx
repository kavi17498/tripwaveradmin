export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform-wide overview of users, trips, and verification activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Users</p>
          <p className="mt-2 text-2xl font-semibold">14,320</p>
        </article>
        <article className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Trips</p>
          <p className="mt-2 text-2xl font-semibold">286</p>
        </article>
        <article className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending Verifications</p>
          <p className="mt-2 text-2xl font-semibold">41</p>
        </article>
        <article className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Daily Activity</p>
          <p className="mt-2 text-2xl font-semibold">2,904</p>
        </article>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="border border-border bg-card p-4">
          <h2 className="font-semibold">Recent Users</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="border border-border p-2">maya@tripwaver.com - traveler</p>
            <p className="border border-border p-2">ethan@tripwaver.com - organizer</p>
            <p className="border border-border p-2">sofia@tripwaver.com - organizer</p>
          </div>
        </article>
        <article className="border border-border bg-card p-4">
          <h2 className="font-semibold">Recent Trips</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="border border-border p-2">Coastal Escape in Portugal</p>
            <p className="border border-border p-2">Nordic Winter Routes</p>
            <p className="border border-border p-2">Private Alpine Retreat</p>
          </div>
        </article>
      </section>
    </div>
  );
}
