"use client";

import { SessionProvider } from "next-auth/react";
import OwnerSidebar from "@/components/owner/Sidebar";
import { useState } from "react";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed] = useState(false);

  return (
    <SessionProvider>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <OwnerSidebar />
        <main
          className="transition-all duration-300"
          style={{
            marginLeft: sidebarCollapsed ? '72px' : '260px',
            padding: '32px',
            minHeight: '100vh',
          }}
        >
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
