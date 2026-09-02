"use client";

// Pagina principală — compune cele 3 zone (sidebar, header, chat) fără logică proprie.
// E client component ca store-ul Zustand și sidebar-ul shadcn să aibă acces la browser APIs.
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Chat } from "@/components/chat/chat";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-svh min-h-0 flex-col">
        <AppHeader />
        <Chat />
      </SidebarInset>
      <SettingsDialog />
    </SidebarProvider>
  );
}
