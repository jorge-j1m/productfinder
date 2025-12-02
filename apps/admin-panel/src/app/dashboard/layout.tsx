"use client";

// import { AppSidebar } from "@/components/navigation/appsidebar";
import { Navbar } from "#/components/navigation/navbar";
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar";
// import { useAuth } from "@/hooks/use-auth";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "10rem",
          "--sidebar-width-mobile": "12rem",
        } as React.CSSProperties
      }
    >
      <div className="flex h-screen w-full">
        {/* <AppSidebar user={user} /> */}
        <SidebarInset className="flex flex-col w-full">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
