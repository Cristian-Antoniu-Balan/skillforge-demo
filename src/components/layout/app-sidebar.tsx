"use client";

// Sidebar-ul principal — structura în 3 zone ca la claude.ai: acțiune, istoric, utilizator.
// Folosim componenta shadcn sidebar ca pe mobil să intre automat în Sheet.
import { ChevronUp, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export function AppSidebar() {
  const profile = useAppStore(state => state.profile);
  const conversations = useAppStore(state => state.conversations);
  const activeConversationId = useAppStore(state => state.activeConversationId);
  const createConversation = useAppStore(state => state.createConversation);
  const setActiveConversation = useAppStore(state => state.setActiveConversation);
  const renameConversation = useAppStore(state => state.renameConversation);
  const deleteConversation = useAppStore(state => state.deleteConversation);
  const setSettingsOpen = useAppStore(state => state.setSettingsOpen);
  const setSettingsTab = useAppStore(state => state.setSettingsTab);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const initials = profile.name
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleRename = (id: string) => {
    if (renameValue.trim()) {
      renameConversation(id, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-3">
        <Button className="w-full justify-start gap-2" onClick={() => createConversation()} variant="outline">
          <Plus className="size-4" />
          New
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="flex min-h-0 flex-1 flex-col px-0">
          <SidebarGroupLabel className="px-4">Chats and tasks</SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0 flex-1 px-2">
            <ScrollArea className="h-[calc(100vh-12rem)] pr-1">
              <SidebarMenu>
                {conversations.map(conversation => (
                  <SidebarMenuItem key={conversation.id} className="group/item relative">
                    {renamingId === conversation.id ? (
                      <Input
                        autoFocus
                        className="h-8"
                        onBlur={() => handleRename(conversation.id)}
                        onChange={event => setRenameValue(event.target.value)}
                        onKeyDown={event => {
                          if (event.key === "Enter") handleRename(conversation.id);
                          if (event.key === "Escape") setRenamingId(null);
                        }}
                        value={renameValue}
                      />
                    ) : (
                      <>
                        <SidebarMenuButton
                          className={cn(
                            "w-full pr-8",
                            activeConversationId === conversation.id && "bg-sidebar-accent font-medium"
                          )}
                          isActive={activeConversationId === conversation.id}
                          onClick={() => setActiveConversation(conversation.id)}
                        >
                          <span className="truncate">{conversation.title}</span>
                        </SidebarMenuButton>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-1 opacity-0 transition-opacity group-hover/item:opacity-100 hover:bg-muted"
                            onClick={event => event.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setRenamingId(conversation.id);
                                setRenameValue(conversation.title);
                              }}
                            >
                              Redenumește
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteConversation(conversation.id)}
                            >
                              Șterge
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <button
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent"
          onClick={() => {
            setSettingsTab("profile");
            setSettingsOpen(true);
          }}
          type="button"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <span className="flex-1 truncate text-sm font-medium">{profile.name}</span>
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
