"use client";

// Sidebar-ul principal — structura în 3 zone ca la claude.ai: acțiune, istoric, utilizator.
// Folosim componenta shadcn sidebar ca pe mobil să intre automat în Sheet.
import { ChevronUp, MoreHorizontal, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuthConfigured } from "@/components/auth/auth-providers";
import { SidebarAuthUser } from "@/components/auth/sidebar-auth-user";
import { GroupConversationDialog } from "@/components/chat/group-conversation-dialog";
import { useChatSession } from "@/components/chat/chat-session-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { CONVERSATION_SEARCH_MAX_LENGTH, conversationMatchesSearch } from "@/lib/conversation-search";
import { cn } from "@/lib/utils";
import { sortTechnologies, useAppStore } from "@/store/useAppStore";

const FILTER_ALL = "all";
const FILTER_UNTAGGED = "untagged";
const SEARCH_DEBOUNCE_MS = 300;

/** Footer fără Auth configurat — doar profilul local (fără login/logout). */
function SidebarLocalUser() {
  const profile = useAppStore(state => state.profile);
  const setSettingsOpen = useAppStore(state => state.setSettingsOpen);
  const setSettingsTab = useAppStore(state => state.setSettingsTab);

  const initials = profile.name
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{profile.name}</span>
          <span className="block truncate text-xs text-muted-foreground">Profil local</span>
        </span>
        <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56" side="top">
        <DropdownMenuItem
          onClick={() => {
            setSettingsTab("profile");
            setSettingsOpen(true);
          }}
        >
          Profilul tău
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar() {
  const authConfigured = useAuthConfigured();
  const conversations = useAppStore(state => state.conversations);
  const technologies = useAppStore(state => state.technologies);
  const activeConversationId = useAppStore(state => state.activeConversationId);
  const setActiveConversation = useAppStore(state => state.setActiveConversation);
  const conversationSearchQuery = useAppStore(state => state.conversationSearchQuery);
  const setConversationSearchQuery = useAppStore(state => state.setConversationSearchQuery);
  const { startNewChat } = useChatSession();
  const renameConversation = useAppStore(state => state.renameConversation);
  const deleteConversation = useAppStore(state => state.deleteConversation);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [tagFilter, setTagFilter] = useState<string>(FILTER_ALL);
  const [groupingConversationId, setGroupingConversationId] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const settledSearchQuery = useDebouncedValue(searchDraft, SEARCH_DEBOUNCE_MS);

  // Filtrul și highlight-ul citesc query-ul settled din store (nu draft-ul).
  useEffect(() => {
    setConversationSearchQuery(settledSearchQuery);
  }, [settledSearchQuery, setConversationSearchQuery]);

  const sortedTechnologies = sortTechnologies(technologies);
  // Filtre pe listă: tehnologie AND Search for (când e settled).
  const filteredConversations = conversations.filter(conversation => {
    const matchesTag = (() => {
      if (tagFilter === FILTER_ALL) return true;
      if (tagFilter === FILTER_UNTAGGED) {
        return conversation.technologyId == null || conversation.technologyId === "";
      }
      return conversation.technologyId === tagFilter;
    })();

    if (!matchesTag) return false;
    return conversationMatchesSearch(conversation, conversationSearchQuery);
  });

  const handleRename = (id: string) => {
    if (renameValue.trim()) {
      renameConversation(id, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const clearSearch = () => {
    setSearchDraft("");
    setConversationSearchQuery("");
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-3">
        <Button className="w-full justify-start gap-2" onClick={() => startNewChat()} variant="outline">
          <Plus className="size-4" />
          Chat nou
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="flex min-h-0 flex-1 flex-col px-0">
          <SidebarGroupLabel className="px-4">Chats and tasks</SidebarGroupLabel>
          <div className="space-y-2 px-4 pb-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground" htmlFor="sidebar-conversation-search">
                Search for
              </Label>
              <div className="relative">
                <Input
                  className="pr-8"
                  id="sidebar-conversation-search"
                  maxLength={CONVERSATION_SEARCH_MAX_LENGTH}
                  onChange={event => {
                    // TODO: validare input (ex. pattern periculos / caractere interzise) — pe moment doar maxLength.
                    setSearchDraft(event.target.value.slice(0, CONVERSATION_SEARCH_MAX_LENGTH));
                  }}
                  value={searchDraft}
                />
                {searchDraft.length > 0 && (
                  <button
                    aria-label="Clear search"
                    className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={clearSearch}
                    type="button"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground" htmlFor="sidebar-tag-filter">
                Filtru tehnologie
              </Label>
              <Select onValueChange={value => setTagFilter(String(value))} value={tagFilter}>
                <SelectTrigger className="w-full" id="sidebar-tag-filter" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTER_ALL}>All</SelectItem>
                  <SelectItem value={FILTER_UNTAGGED}>Fără tag</SelectItem>
                  {sortedTechnologies.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SidebarGroupContent className="min-h-0 flex-1 px-2">
            <ScrollArea className="h-[calc(100vh-14rem)] pr-1">
              <SidebarMenu>
                {filteredConversations.map(conversation => (
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
                            <DropdownMenuItem onClick={() => setGroupingConversationId(conversation.id)}>
                              Grupează
                            </DropdownMenuItem>
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
        {/* useSession doar pe ramura cu SessionProvider — componente separate, nu hook condiționat. */}
        {authConfigured ? <SidebarAuthUser /> : <SidebarLocalUser />}
      </SidebarFooter>

      <GroupConversationDialog
        conversationId={groupingConversationId}
        onOpenChange={open => {
          if (!open) setGroupingConversationId(null);
        }}
        open={groupingConversationId !== null}
      />
    </Sidebar>
  );
}
