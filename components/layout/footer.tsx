export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-10 md:grid-cols-4 md:px-6">
        <div>
          <h3 className="text-base font-semibold">TripWaver</h3>
          <p className="mt-2 text-sm text-muted-foreground">Social travel platform for organized public and private trips.</p>
        </div>
        <div>
          <p className="text-sm font-semibold">Product</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Trips</li>
            <li>Bookings</li>
            <li>Payments</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Company</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>About</li>
            <li>Careers</li>
            <li>Contact</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Legal</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Privacy Policy</li>
            <li>Terms</li>
            <li>Security</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
