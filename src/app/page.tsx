"use client";

// Pagina principală — ChatSessionRoot ridică useChat peste sidebar/header (aceeași listă de mesaje).
import { Chat, ChatSessionRoot } from "@/components/chat/chat";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Home() {
  return (
    <SidebarProvider>
      <ChatSessionRoot>
        <AppSidebar />
        <SidebarInset className="flex h-svh min-h-0 flex-col">
          <AppHeader />
          <Chat />
        </SidebarInset>
        <SettingsDialog />
      </ChatSessionRoot>
    </SidebarProvider>
  );
}
