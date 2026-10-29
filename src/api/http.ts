import { REQUEST_TIMEOUT_MS } from "./config";
import type { ApiErrorBody } from "./types";

export type Method = "GET" | "POST" | "PUT" | "DELETE";

export type ApiRequest = {
  method: Method;
  path: string;
  body?: unknown;
  token?: string | null;
};

/** Sunucunun döndürdüğü hata; ekranlar `message` alanını kullanıcıya gösterir. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** İsteği sunucuya taşıyan katman. Gerçek ve sahte sunucu aynı arayüzü uygular. */
export interface Transport {
  send<T>(req: ApiRequest): Promise<T>;
}

/** Gateway'lere HTTPS/JSON üzerinden bağlanan gerçek taşıyıcı. */
export class HttpTransport implements Transport {
  constructor(private readonly baseUrl: string) {}

  async send<T>(req: ApiRequest): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const headers: Record<string, string> = { Accept: "application/json" };
    if (req.body !== undefined) headers["Content-Type"] = "application/json";
    if (req.token) headers.Authorization = `Bearer ${req.token}`;

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${req.path}`, {
        method: req.method,
        headers,
        body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
        signal: controller.signal,
      });
    } catch (e) {
      const aborted = e instanceof Error && e.name === "AbortError";
      throw new ApiError(0, aborted ? "timeout" : "network", aborted ? "Sunucu zamanında yanıt vermedi." : "Sunucuya ulaşılamıyor.");
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 204) return undefined as T;

    const text = await res.text();
    const data = text ? safeJson(text) : undefined;

    if (!res.ok) {
      const err = (data ?? {}) as Partial<ApiErrorBody>;
      throw new ApiError(res.status, err.code ?? "http_error", err.message ?? `İstek başarısız (${res.status}).`);
    }
    return data as T;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(502, "bad_response", "Sunucudan geçersiz yanıt alındı.");
  }
}
