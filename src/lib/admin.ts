export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("admin_token");
}

export async function adminFetch(url: string, options: RequestInit = {}) {
  const token = getAdminToken();
  if (!token) {
    throw new Error("인증이 필요합니다");
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401) {
    sessionStorage.removeItem("admin_token");
    window.location.href = "/admin";
    throw new Error("인증이 만료되었습니다");
  }

  return res;
}
