import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Aceolution Finance",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden" suppressHydrationWarning>
      {children}
    </div>
  );
}
