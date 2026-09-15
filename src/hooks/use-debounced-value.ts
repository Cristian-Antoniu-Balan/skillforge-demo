import { useEffect, useState } from "react";

/**
 * Returnează `value` doar după ce a rămas neschimbat `delayMs` ms.
 * Folosit la Search for — filtrarea rulează pe valoarea settled, nu la fiecare tastă.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
