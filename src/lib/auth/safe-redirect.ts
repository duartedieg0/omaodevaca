export const DEFAULT_AUTHENTICATED_PATH = "/app/dashboard";

const BASE = "http://localhost";

/**
 * Retorna um caminho interno seguro dentro de /app para redirecionar após o
 * login. Qualquer outro valor (URL absoluta, //host, \host, path traversal)
 * cai no destino padrão, evitando open redirect.
 */
export function safeRedirectPath(next: string | null | undefined): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.includes("//") ||
    next.includes("\\")
  ) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  const isInternal = url.origin === BASE;
  const isAppPath =
    url.pathname === "/app" || url.pathname.startsWith("/app/");

  if (!isInternal || !isAppPath) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  return `${url.pathname}${url.search}`;
}
