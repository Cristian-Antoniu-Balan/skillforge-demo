"use client";

/**
 * Citește ?authError= / ?error= din URL, arată mesajul în română, apoi șterge parametrul.
 * Refresh / link copiat nu trebuie să reafișeze un eșec străin.
 */
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { authErrorMessage } from "@/lib/auth-errors";

export function AuthErrorToaster() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // authError = motiv păstrat de ruta noastră; error = codul Auth.js pe pages.error → /
    const code = searchParams.get("authError") ?? searchParams.get("error");
    if (!code) return;

    toast.message(authErrorMessage(code));

    const next = new URLSearchParams(searchParams.toString());
    next.delete("authError");
    next.delete("authErrorDescription");
    next.delete("error");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [searchParams, router, pathname]);

  return null;
}
