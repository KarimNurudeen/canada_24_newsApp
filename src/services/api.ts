import { NativeModules, Platform } from 'react-native';

type PaginatedResponse<T> = {
  results: T[];
};

type ApiRequestOptions = RequestInit & {
  token?: string;
};

type SourceCodeModule = {
  scriptURL?: string;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const PRODUCTION_API_BASE_URL = 'https://ca.niveel.com/api/v1';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function getHostFromScriptUrl(): string | null {
  const scriptUrl = (NativeModules.SourceCode as SourceCodeModule | undefined)?.scriptURL;
  if (!scriptUrl) return null;

  const match = scriptUrl.match(/^(?:https?|exp):\/\/([^/:]+)/i);
  return match?.[1] ?? null;
}

function getDefaultApiBaseUrl(): string {
  // A release build has no Metro host to infer, so never fall back to localhost there.
  if (!__DEV__) return PRODUCTION_API_BASE_URL;

  const metroHost = getHostFromScriptUrl();
  if (metroHost) {
    return `http://${metroHost}:8000/api/v1`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }

  return 'http://127.0.0.1:8000/api/v1';
}

const explicitBaseUrl = typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_BASE_URL : undefined;

export const API_BASE_URL = normalizeBaseUrl(explicitBaseUrl || getDefaultApiBaseUrl());

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers, body, ...init } = options;
  const requestHeaders = new Headers(headers);

  requestHeaders.set('Accept', 'application/json');
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }
  if (body && !(body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...init,
    body,
    headers: requestHeaders,
  });

  return parseResponse<T>(response);
}

export function extractList<T>(payload: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.results;
}
