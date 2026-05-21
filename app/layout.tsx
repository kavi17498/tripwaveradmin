import type { Metadata } from "next";
import { Public_Sans, Source_Code_Pro } from "next/font/google";
import { ToastProvider } from "@/components/feedback/toast-provider";
import "./globals.css";
import Script from "next/script";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const codeFont = Source_Code_Pro({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TripWaver",
  description: "TripWaver travel and trip management platform frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${publicSans.variable} ${codeFont.variable} antialiased`}>
        <ToastProvider>{children}</ToastProvider>
        <Script type="text/javascript" src="https://www.payhere.lk/lib/payhere.js" />
      </body>
    </html>
  );
}
