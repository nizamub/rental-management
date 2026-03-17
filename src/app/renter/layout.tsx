"use client";

import { SessionProvider } from "next-auth/react";
import RenterNav from "@/components/renter/RenterNav";

export default function RenterLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <RenterNav />
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
