// Cliente HTTP centralizado para hablar con el backend usando autenticacion
// por cookie httpOnly (JWT). Toda llamada a la API deberia pasar por aca en
// vez de usar axios/fetch directo, para que la cookie de sesion y el header
// CSRF viajen siempre de la misma forma.
import axios from 'axios';
import { API_BACK } from 'config';

const MUTATING_METHODS = ['post', 'put', 'patch', 'delete'];

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

// flask-jwt-extended expone el token CSRF en una cookie legible por JS
// (separada de la cookie httpOnly que guarda el JWT) para el patron
// double-submit cookie.
function getCsrfToken() {
  return getCookie('csrf_access_token');
}

export const apiClient = axios.create({
  baseURL: API_BACK,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (MUTATING_METHODS.includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-TOKEN'] = csrfToken;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && !window.location.pathname.startsWith('/authentication')) {
      window.location.href = '/authentication/sign-in';
    }
    return Promise.reject(error);
  }
);

// Wrapper de fetch con el mismo comportamiento (cookie de sesion + CSRF)
// para el codigo existente que usa fetch en lugar de axios.
export async function apiFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (MUTATING_METHODS.includes(method.toLowerCase())) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set('X-CSRF-TOKEN', csrfToken);
    }
  }

  const response = await fetch(url, {
    ...options,
    credentials: options.credentials || 'include',
    headers,
  });

  if (response.status === 401 && !window.location.pathname.startsWith('/authentication')) {
    window.location.href = '/authentication/sign-in';
  }

  return response;
}
