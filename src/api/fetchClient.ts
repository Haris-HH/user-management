// Class
import { ApiError } from "../types/class";

// Store
import { getAccessToken, setAccessToken } from "./tokenStore";

/*
  Arrays are permitted because some endpoints take repeated ids; they are
  serialised by String(), i.e. comma-joined, which is exactly what
  URLSearchParams did with them before.
*/
export type QueryParamValue =
  | string
  | number
  | boolean
  | readonly string[]
  | readonly number[]
  | null
  | undefined;

export interface FetchOptions extends RequestInit {
  queryParams?: Record<string, QueryParamValue>;
  skipAuth?: boolean;
  isFormData?: boolean;
  isStream?: boolean;
  retryCount?: number;
}

/*
  Serialises query params, dropping null/undefined entries so an optional
  filter never reaches the API as the literal string "undefined".
*/
const buildQueryString = (
  queryParams?: Record<string, QueryParamValue>
): string => {
  if (!queryParams) return "";

  const search = new URLSearchParams();

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    search.append(key, String(value));
  });

  const queryString = search.toString();

  return queryString ? `?${queryString}` : "";
};

// Env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SERVICE_CHANNEL = import.meta.env.VITE_API_SERVICE_CHANNEL;

/*
  Legacy keys from when the tokens lived in localStorage. Nothing writes
  them any more, but a browser that still has them from before this change
  must not keep leaking an access token to every script on the page.
*/
const LEGACY_ACCESS_TOKEN_KEY = "accessToken";
const LEGACY_REFRESH_TOKEN_KEY = "refreshToken";
const LEGACY_USER_UID_KEY = "userUid";

let isRefreshing = false;

let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const clearAuthStorage = () => {
  setAccessToken(null);

  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_UID_KEY);
};

const redirectToLogin = () => {
  clearAuthStorage();

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

const processQueue = (error: unknown, token?: string) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });

  failedQueue = [];
};

const createHttpError = async (
  response: Response,
  endpoint: string
): Promise<ApiError> => {
  /*
    Read the body once as text. Calling response.json() first and then
    falling back to response.text() cannot work — the first read already
    consumes the stream, so the fallback always failed and the server's
    error message was replaced by the bare status text.
  */
  const raw = await response.text().catch(() => "");

  let message = response.statusText;

  if (raw) {
    try {
      const data: unknown = JSON.parse(raw);

      const parsed =
        typeof data === "object" && data !== null
          ? (data as { message?: string; error?: string })
          : null;

      message = parsed?.message || parsed?.error || response.statusText;
    } catch {
      message = raw;
    }
  }

  return new ApiError({
    endpoint,
    statusCode: response.status,
    success: false,
    message,
  });
};

// ==============================
// Location Headers
// ==============================

/*
  Every request carries the caller's coordinates for backend auditing.
  A fix used to be requested per request with maximumAge: 0, so each call
  waited on a fresh GPS lock (up to the 5s timeout) and a page issuing a
  dozen parallel requests triggered a dozen independent lookups.

  The fix is cached for LOCATION_TTL_MS and concurrent callers share one
  in-flight lookup, so the headers are unchanged but the wait happens once.
*/
const LOCATION_TTL_MS = 60_000;

/*
  A denied permission or a signal-less device makes every lookup run to the
  5s timeout, so failures are cached too — briefly, so that granting the
  permission mid-session is still picked up quickly.
*/
const LOCATION_FAILURE_TTL_MS = 10_000;

let cachedLocationHeaders: HeadersInit | null = null;
let cachedLocationExpiresAt = 0;
let pendingLocationRequest: Promise<HeadersInit> | null = null;

const requestPosition = (): Promise<GeolocationPosition> =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: LOCATION_TTL_MS,
    });
  });

const getLocationHeaders = async (): Promise<HeadersInit> => {
  if (!navigator.geolocation) {
    return {};
  }

  if (cachedLocationHeaders && Date.now() < cachedLocationExpiresAt) {
    return cachedLocationHeaders;
  }

  pendingLocationRequest ??= requestPosition()
    .then((position) => {
      const headers: HeadersInit = {
        "x-latitude": position.coords.latitude.toString(),
        "x-longitude": position.coords.longitude.toString(),
      };

      cachedLocationHeaders = headers;
      cachedLocationExpiresAt = Date.now() + LOCATION_TTL_MS;

      return headers;
    })
    .catch((error: unknown) => {
      console.error("Cannot get location:", error);

      const headers: HeadersInit = {};

      cachedLocationHeaders = headers;
      cachedLocationExpiresAt = Date.now() + LOCATION_FAILURE_TTL_MS;

      return headers;
    })
    .finally(() => {
      pendingLocationRequest = null;
    });

  return pendingLocationRequest;
};

// ==============================
// Refresh Token
// ==============================

const refreshTokenRequest = async (): Promise<{
  accessToken: string;
}> => {
  const response = await fetch(`${API_BASE_URL}/user-management/users/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw await createHttpError(response, "/user-management/users/refresh");
  }

  return response.json();
};

// ==============================
// Handle Refresh Queue
// ==============================

const handleAuthError = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const result = await refreshTokenRequest();

    const newAccessToken = result.accessToken;

    setAccessToken(newAccessToken);

    processQueue(null, newAccessToken);

    return newAccessToken;
  } 
  catch (error) {
    processQueue(error);
    throw error;
  } 
  finally {
    isRefreshing = false;
  }
};

// ==============================
// Main Fetch Client
// ==============================

export const fetchClient = async <T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> => {
  const {
    queryParams,
    skipAuth = false,
    isFormData = false,
    isStream = false,
    retryCount = 0,
    headers: customHeaders,
    ...fetchOptions
  } = options;

  const queryString = buildQueryString(queryParams);

  const makeRequest = async (token?: string): Promise<T> => {
    const locationHeaders = await getLocationHeaders();

    const headers: HeadersInit = {
      "x-service-channel": SERVICE_CHANNEL,
      ...(isFormData
        ? {}
        : {
            "Content-Type": "application/json",
          }),
      ...locationHeaders,
      ...(token && !skipAuth
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...customHeaders,
    };

    let response: Response;

    try {
      response = await fetch(`${API_BASE_URL}${endpoint}${queryString}`, {
        ...fetchOptions,
        credentials: "include",
        headers,
      });
    } 
    catch (error) {
      console.error("Network error:", error);

      if (!skipAuth && getAccessToken()) {
        redirectToLogin();
      }

      throw error;
    }

    // Unauthorized
    if ((response.status === 401 || response.status === 403) && !skipAuth) {
      if (retryCount >= 1) {
        window.dispatchEvent(new Event("force-logout"));
        throw new ApiError({
          endpoint,
          statusCode: 401,
          success: false,
          message: "Too many retries",
        });
      }

      try {
        const newAccessToken = await handleAuthError();

        return fetchClient<T>(endpoint, {
          ...options,
          retryCount: retryCount + 1,
          headers: {
            ...customHeaders,
            Authorization: `Bearer ${newAccessToken}`,
          },
        });
      } 
      catch (error) {
        window.dispatchEvent(new Event("force-logout"));
        throw error;
      }
    }

    if (!response.ok) {
      throw await createHttpError(response, endpoint);
    }

    if (isStream) {
      return response as unknown as T;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  };

  const accessToken = getAccessToken() || undefined;

  return makeRequest(accessToken);
};

export const combineURL = (url: string, endpoint: string) => {
  return `${url}${endpoint}`;
};

/*
  A hard reload clears the in-memory access token along with everything
  else in JS, but the refresh token survives it in an httpOnly cookie. This
  trades that cookie for a fresh access token on app boot so a reload
  doesn't read as a logout - callers should treat a `false` return as "no
  valid session" and route to /login.
*/
export const restoreSession = async (): Promise<boolean> => {
  try {
    const { accessToken } = await refreshTokenRequest();

    setAccessToken(accessToken);

    return true;
  }
  catch {
    setAccessToken(null);

    return false;
  }
};