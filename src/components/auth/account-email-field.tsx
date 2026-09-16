"use client";

/**
 * Câmp readonly pentru emailul contului OAuth.
 * Separat ca să poată folosi useSession — hook legal doar sub SessionProvider.
 * Emailul NU intră în tipul Profile / localStorage / system prompt (ar pleca la model la fiecare mesaj).
 */
import { useSession } from "next-auth/react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountEmailField() {
  const { data: session, status } = useSession();

  let value: string;
  let hint: string;

  if (status === "loading") {
    value = "";
    hint = "Se verifică sesiunea…";
  } else if (status === "unauthenticated" || !session?.user) {
    value = "";
    hint = "Nu ești conectat — emailul contului apare aici după autentificare.";
  } else if (!session.user.email) {
    // GitHub poate returna null dacă emailul e ascuns în setările contului.
    value = "";
    hint = "Furnizorul nu ne-a trimis emailul (poate e ascuns în setările contului).";
  } else {
    value = session.user.email;
    hint =
      "Vine de la furnizorul de autentificare — nu îl poți schimba de aici. Nu face parte din profilul trimis modelului.";
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="account-email">Email cont</Label>
      <Input
        id="account-email"
        readOnly
        // Needitabil din două motive explicite în hint: e al furnizorului; nu e câmp de profil.
        value={status === "loading" ? "Se încarcă…" : value || "—"}
      />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
