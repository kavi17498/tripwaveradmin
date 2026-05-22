"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function PrivacyPage() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-16 md:px-6 md:py-24">
        <div className="space-y-12">
          {/* Header */}
          <div className="space-y-4 border-b border-border pb-8">
            <span className="text-xs font-semibold tracking-wider text-primary uppercase block">Legal Guidelines</span>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Last updated: May 22, 2026. This page details how TripWaver handles your personal data.
            </p>
          </div>

          {/* Privacy content */}
          <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">1. Introduction</h2>
              <p>
                Welcome to TripWaver. We respect your privacy and are committed to protecting your personal data. 
                This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website 
                and use our collaborative travel platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">2. Information We Collect</h2>
              <p>
                We collect personal information that you voluntarily provide to us when registering, booking a trip, 
                or communicating with us. This includes:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Personal identification details (Name, email address, phone number).</li>
                <li>Profile details (Avatar images, user bio, gender, and date of birth).</li>
                <li>Payment details processed securely via verified third-party payment gateways.</li>
                <li>Itinerary coordinates and collaborative trip workspace activities.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">3. How We Use Your Information</h2>
              <p>
                We use the collected data to provide, improve, and secure our services, specifically to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Create and manage your user account and collaborative trip workspaces.</li>
                <li>Process payments, bookings, and reservations for public or private tours.</li>
                <li>Send system notifications, reminders, and updates regarding your scheduled trips.</li>
                <li>Detect and prevent fraudulent activities or security breaches.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">4. Data Sharing and Security</h2>
              <p>
                We do not sell your personal data. We only share information with verified local guides and service providers 
                directly involved in delivering your booked trips. We implement industry-standard security measures (such as SSL encryption 
                and secure Firebase authentication) to keep your personal information safe.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">5. Your Legal Rights</h2>
              <p>
                Under relevant data protection laws, you have the right to access, correct, or request the deletion of your personal data stored on our platform. 
                If you wish to exercise any of these rights, please contact our support team at support@tripwaver.lk.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
