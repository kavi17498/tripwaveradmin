import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4 py-10 max-w-7xl md:px-6">
        <div>
          <h3 className="text-base font-semibold">TripWaver</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Social travel platform for organized public and private trips in Sri Lanka.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium text-muted-foreground">
          <Link href="/about" className="hover:text-foreground transition-colors">
            About Us
          </Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">
            Contact Us
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
