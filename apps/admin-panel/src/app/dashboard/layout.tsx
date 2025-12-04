import { cookies } from "next/headers";
import { AppSidebar } from "#/components/navigation/appsidebar";
import { Navbar } from "#/components/navigation/navbar";
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "10rem",
          "--sidebar-width-mobile": "12rem",
        } as React.CSSProperties
      }
      defaultOpen={defaultOpen}
    >
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col w-full">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
