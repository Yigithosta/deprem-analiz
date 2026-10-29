/**
 * API yapılandırması.
 *
 * `EXPO_PUBLIC_API_URL` tanımlıysa istemci gerçek gateway'lere HTTPS üzerinden
 * bağlanır. Tanımlı değilse uygulama, aynı sözleşmeyi uygulayan cihaz içi sahte
 * sunucuyla çalışır; böylece arka uç hazır olmadan da tüm akışlar denenebilir.
 *
 * Expo, `EXPO_PUBLIC_` önekli değişkenleri derleme sırasında koda gömer; bu
 * yüzden değişkene yalnızca nokta gösterimiyle erişilmelidir.
 */
const raw = process.env.EXPO_PUBLIC_API_URL;

export const API_BASE_URL: string | null = raw && raw.trim() ? raw.trim().replace(/\/+$/, "") : null;

export const API_MODE: "live" | "mock" = API_BASE_URL ? "live" : "mock";

/** Tek bir isteğin en uzun bekleme süresi. */
export const REQUEST_TIMEOUT_MS = 15_000;

/** Bildirimlerin yenilenme aralığı. */
export const NOTIFICATION_POLL_MS = 15_000;

/** Çalışan model işlerinin durum sorgulama aralığı. */
export const JOB_POLL_MS = 600;
