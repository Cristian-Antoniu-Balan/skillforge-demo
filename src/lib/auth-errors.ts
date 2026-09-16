/**
 * Traducere unică a codurilor Auth.js / OAuth → mesaje în română.
 * Un singur loc: UI-ul nu împrăștie texte și nu afișează niciodată codul brut.
 */

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Anulare la furnizor (GitHub/Google trimit access_denied pe callback).
  access_denied: "Te-ai răzgândit — autentificarea a fost anulată. Poți încerca din nou oricând.",
  // Coduri Auth.js pe pagina de eroare configurată să ducă înapoi în app.
  Configuration: "Autentificarea nu e configurată corect pe server. Verifică variabilele de mediu.",
  AccessDenied: "Accesul a fost refuzat. Nu poți continua cu acest cont.",
  Verification: "Link-ul de verificare a expirat sau a fost deja folosit.",
  OAuthSignin: "Nu am putut porni autentificarea la furnizor. Încearcă din nou.",
  OAuthCallback: "Furnizorul a răspuns cu o eroare la întoarcerea în aplicație.",
  OAuthCreateAccount: "Contul nu a putut fi creat la furnizor.",
  EmailCreateAccount: "Contul nu a putut fi creat cu acest email.",
  Callback: "Autentificarea s-a întrerupt la pasul de întoarcere în aplicație.",
  OAuthAccountNotLinked:
    "Acest email e legat deja de alt furnizor. Folosește metoda cu care te-ai conectat prima dată.",
  EmailSignin: "Nu am putut trimite emailul de autentificare.",
  CredentialsSignin: "Datele de autentificare nu sunt corecte.",
  SessionRequired: "Trebuie să te autentifici ca să continui.",
  Default: "Autentificarea nu a reușit. Încearcă din nou."
};

/** Mesaj generic — pentru coduri necunoscute dintr-o versiune viitoare a librăriei. */
const FALLBACK_MESSAGE = "Autentificarea nu a reușit. Încearcă din nou.";

/**
 * Traduce un cod de eroare într-un mesaj pentru om.
 * Nu returnează niciodată codul brut și nici textul englezesc al librăriei.
 */
export function authErrorMessage(code: string | null | undefined): string {
  if (!code) return FALLBACK_MESSAGE;
  return AUTH_ERROR_MESSAGES[code] ?? FALLBACK_MESSAGE;
}
