"use client";

/**
 * Rândul de utilizator din sidebar — un singur meniu pentru:
 * profil local (Preferințe), login și logout.
 * Afișare: cont GitHub când ești conectat; altfel profilul local din store.
 * Se montează doar când autentificarea e configurată (vezi AppSidebar).
 */
import { ChevronUp, LogIn, LogOut, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

import { LoginDialog } from "@/components/auth/login-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";

function initialsFrom(name: string | null | undefined, email: string | null | undefined): string {
  if (name?.trim()) {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  if (email?.trim()) return email.slice(0, 2).toUpperCase();
  return "?";
}

export function SidebarAuthUser() {
  const { data: session, status } = useSession();
  const profile = useAppStore(state => state.profile);
  const setSettingsOpen = useAppStore(state => state.setSettingsOpen);
  const setSettingsTab = useAppStore(state => state.setSettingsTab);
  const [loginOpen, setLoginOpen] = useState(false);

  const openProfile = () => {
    setSettingsTab("profile");
    setSettingsOpen(true);
  };

  if (status === "loading") {
    return <div className="px-2 py-3 text-sm text-muted-foreground">Se verifică sesiunea…</div>;
  }

  const signedIn = Boolean(session?.user);
  // Conectat → identitate de la furnizor; deconectat → profilul local (editabil în Preferințe).
  const displayName = signedIn
    ? session?.user?.name?.trim() || session?.user?.email?.trim() || "Cont conectat"
    : profile.name;
  const displayEmail = signedIn ? (session?.user?.email ?? null) : null;
  const displayImage = signedIn ? (session?.user?.image ?? null) : null;
  const initials = signedIn
    ? initialsFrom(session?.user?.name, session?.user?.email)
    : initialsFrom(profile.name, null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent">
          <Avatar className="size-8">
            {displayImage ? <AvatarImage alt="" src={displayImage} /> : null}
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{displayName}</span>
            {displayEmail ? (
              <span className="block truncate text-xs text-muted-foreground">{displayEmail}</span>
            ) : (
              <span className="block truncate text-xs text-muted-foreground">
                {signedIn ? "Cont GitHub" : "Profil local"}
              </span>
            )}
          </span>
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56" side="top">
          <DropdownMenuItem onClick={openProfile}>
            <UserRound className="size-4" />
            Profilul tău
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {signedIn ? (
            <DropdownMenuItem
              onClick={() => {
                void signOut({ callbackUrl: "/" });
              }}
            >
              <LogOut className="size-4" />
              Ieșire din cont
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setLoginOpen(true)}>
              <LogIn className="size-4" />
              Conectează-te cu GitHub
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <LoginDialog onOpenChange={setLoginOpen} open={loginOpen} />
    </>
  );
}
