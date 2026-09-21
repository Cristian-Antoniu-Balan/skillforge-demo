"use client";

// Pagina principală — așteaptă hidratarea store-ului, apoi ridică useChat peste sidebar/header.
import { Chat, ChatSessionRoot } from "@/components/chat/chat";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PersistenceGate } from "@/components/persistence/persistence-gate";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useStoreHydration } from "@/hooks/use-store-hydration";

export default function Home() {
  const hydrated = useStoreHydration();

  // Fără poartă: primul paint vede conversations=[] din defaults → flash listă goală
  // (și orice „dacă e goală, creează" ar inventa conversații la fiecare refresh).
  if (!hydrated) {
    return <div className="flex h-svh items-center justify-center text-sm text-muted-foreground">Se încarcă…</div>;
  }

  return (
    <PersistenceGate>
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
    </PersistenceGate>
  );
}
