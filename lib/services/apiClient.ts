const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
};

const toUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const parseJsonSafely = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text };
  }
};

const resolveErrorMessage = (status: number, payload: Record<string, unknown> | null) => {
  if (!payload) return `Request failed with status ${status}.`;

  const message = payload.message;
  if (typeof message === "string") return message;

  const error = payload.error;
  if (typeof error === "string") return error;

  return `Request failed with status ${status}.`;
};

export const apiClient = {
  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { method = "GET", body, token, headers = {} } = options;

    const response = await fetch(toUrl(path), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(resolveErrorMessage(response.status, payload));
    }

    return payload as T;
  },

  async authenticatedRequest<T>(path: string, token: string, options: Omit<ApiRequestOptions, "token"> = {}): Promise<T> {
    return this.request<T>(path, { ...options, token });
  },
};
