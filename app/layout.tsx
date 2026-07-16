import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DashboardScrollLock from "../components/DashboardScrollLock";
import { ToastProvider } from "../components/ToastProvider";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-af-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-af-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Aceolution Finance | Expense Approval & Tracking System",
  description: "Secure internal expense requests, approvals, disbursements, and payment tracking.",
  icons: {
    icon: [{ url: "/Ace_logo_small.png", type: "image/png" }],
    apple: [{ url: "/Ace_logo_small.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col bg-[var(--af-bg)] text-slate-900 font-sans" suppressHydrationWarning>
        <ToastProvider>
          <DashboardScrollLock />
          <Header />
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
