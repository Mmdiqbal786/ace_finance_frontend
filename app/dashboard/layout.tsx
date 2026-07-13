import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | AceFinance",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] w-full overflow-hidden sm:h-[calc(100dvh-4rem)]">
      {children}
    </div>
  );
}
