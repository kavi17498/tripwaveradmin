"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-16 md:px-6 md:py-24">
        <div className="space-y-12">
          {/* Header */}
          <div className="space-y-4 border-b border-border pb-8">
            <span className="text-xs font-semibold tracking-wider text-primary uppercase block">Get In Touch</span>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Contact Us</h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Have questions about an upcoming trip, payment, or registering as a local guide? Our support team is here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Details */}
            <div className="md:col-span-1 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Email Support</h3>
                <p className="mt-1 text-sm font-medium">support@tripwaver.lk</p>
                <p className="text-xs text-muted-foreground mt-1">We respond within 24 hours.</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Location</h3>
                <p className="mt-1 text-sm font-medium">TripWaver HQ</p>
                <p className="text-xs text-muted-foreground mt-1">Colombo, Sri Lanka</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Hours</h3>
                <p className="mt-1 text-sm font-medium">Mon - Fri: 9am - 5pm</p>
                <p className="text-xs text-muted-foreground mt-1">UTC +5:30 (Sri Lanka time)</p>
              </div>
            </div>

            {/* Message Form */}
            <div className="md:col-span-2 border border-border bg-card p-6 md:p-8 rounded-sm">
              <h2 className="text-xl font-bold mb-4">Send a Message</h2>
              {submitted ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-sm p-4 text-sm font-medium">
                  Thank you! Your message has been sent successfully. We will get back to you soon.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Your Name</label>
                      <Input
                        required
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Your Email</label>
                      <Input
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Subject</label>
                    <Input
                      required
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Trip inquiry"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Message</label>
                    <textarea
                      required
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className="placeholder:text-muted-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                      placeholder="How can we assist you?"
                    />
                  </div>

                  <Button type="submit" className="w-full md:w-auto">
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
