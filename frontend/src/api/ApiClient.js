import { ApiError } from '../errors/ApiError';
import { RepositoryError } from '../errors/RepositoryError';

let memoryToken = null;

export const setToken = (token) => { memoryToken = token; };
export const getToken = () => memoryToken;

// Single-flight refresh: when many requests 401 at once (a portal/admin page
// fires several in parallel), they must NOT each call /auth/refresh — that both
// trips the rate limit (429) and, because the refresh token rotates on every
// use, makes the concurrent calls invalidate one another and collapse the
// session. Instead they all await one shared refresh.
let refreshInFlight = null;
export async function refreshAccessToken() {
  const baseURL = import.meta.env.VITE_API_URL || '/api';
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await fetch(`${baseURL}/auth/refresh`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new ApiError('Session expired', { status: res.status });
      const { data } = await res.json();
      setToken(data.access_token);
      return data.access_token;
    })().finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

const requestInterceptors = [];
const responseInterceptors = [];

export const addRequestInterceptor = (fn) => requestInterceptors.push(fn);
export const addResponseInterceptor = (fn) => responseInterceptors.push(fn);

export const api = async (endpoint, options = {}) => {
  const baseURL = import.meta.env.VITE_API_URL || '/api';
  const url = `${baseURL}${endpoint}`;
  
  let config = {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(memoryToken && { 'Authorization': `Bearer ${memoryToken}` }),
      ...options.headers
    }
  };

  // Run Request Interceptors
  for (const interceptor of requestInterceptors) {
    config = await interceptor(config);
  }

  // Default 30s. Hosting on a scale-to-zero free tier (Render) means the first
  // request after idle can take 30-50s to cold-start; a short timeout would abort
  // mid-wake and surface a false "failed" even though the server completes the
  // write (e.g. signup would create the account yet show an error). Auth calls
  // pass a longer timeout (see AuthClient) as they're the usual cold entry point.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);
  
  let res;
  try {
    res = await fetch(url, { ...config, signal: controller.signal });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new RepositoryError("Request timeout", new ApiError("Timeout", { status: 408 }));
    }
    throw new RepositoryError("Network error", new ApiError("Network Error", { status: 0 }));
  }
  clearTimeout(timeoutId);
  
  // Refresh Token Logic — de-duplicated across concurrent 401s (see above).
  if (res.status === 401 && !config._retry) {
    try {
      const newToken = await refreshAccessToken(baseURL);
      config.headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, { ...config, _retry: true });
    } catch (err) {
      setToken(null);
      throw new RepositoryError("Session expired", err);
    }
  }

  // Run Response Interceptors
  for (const interceptor of responseInterceptors) {
    res = await interceptor(res);
  }

  let json = {};
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    json = await res.json();
  } else if (contentType && contentType.includes('blob')) {
    return await res.blob();
  }

  if (!res.ok) {
    throw new RepositoryError("API Error", new ApiError(json.error || json.message || "API request failed", { status: res.status }));
  }
  
  return json.data !== undefined ? json.data : json;
};

api.get = (endpoint, opts) => api(endpoint, { ...opts, method: 'GET' });
api.post = (endpoint, body, opts) => api(endpoint, { ...opts, method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) });
api.put = (endpoint, body, opts) => api(endpoint, { ...opts, method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) });
api.patch = (endpoint, body, opts) => api(endpoint, { ...opts, method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body) });
api.delete = (endpoint, opts) => api(endpoint, { ...opts, method: 'DELETE' });
api.upload = (endpoint, formData, opts) => api(endpoint, { ...opts, method: 'POST', body: formData });
api.download = (endpoint, opts) => api(endpoint, { ...opts, method: 'GET', headers: { 'Accept': 'application/blob' } });

