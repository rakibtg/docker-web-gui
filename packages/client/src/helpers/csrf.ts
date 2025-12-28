let cachedToken: string | null = null;
let inflightRequest: Promise<string> | null = null;

export async function getCsrfToken(): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }

  if (!inflightRequest) {
    inflightRequest = fetch("/api/csrf", {
      method: "GET",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch CSRF token (${response.status})`);
        }
        const payload = await response.json();
        const token =
          typeof payload?.csrfToken === "string" ? payload.csrfToken : null;
        if (!token) {
          throw new Error("CSRF token missing in response");
        }
        cachedToken = token;
        return token;
      })
      .finally(() => {
        inflightRequest = null;
      });
  }

  return inflightRequest;
}

export function clearCsrfToken(): void {
  cachedToken = null;
}
