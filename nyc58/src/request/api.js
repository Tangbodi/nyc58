import { registrationRequest } from '../types/interface.js';

const API_BASE_URL = ((import.meta.env && import.meta.env.VITE_API_BASE_URL) || '').replace(/\/$/, '');

/**
 * Builds a full URL from a relative API path.
 * @param {string} path
 */
const buildURL = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) return normalizedPath;
  return `${API_BASE_URL}${normalizedPath}`;
};

/**
 * Handles the fetch response, ensuring JSON gets parsed and errors are descriptive.
 * @param {Response} response
 * @returns {Promise<any>}
 */
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text();

  if (!response.ok) {
    const message =
      (typeof payload === 'string' && payload) ||
      (payload && payload.message) ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

/**
 * Internal helper for POST requests.
 * @param {string} path
 * @param {any} body
 * @returns {Promise<any>}
 */
const post = (path, body) => {
  return fetch(buildURL(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }).then(handleResponse);
};

/**
 * registration
 * @param {RegistrationAPIReq} params
 * @returns {Promise<APIRes<RegistrationAPIRes>>}
 */
export const registrationAPI = (params) => {
  const payload = {
    ...registrationRequest,
    ...params
  };

  return post('/api/v1/user/registration', payload);
};

/**
 * login
 * @param {LoginAPIReq} params
 * @returns {Promise<APIRes<LoginAPIRes>>}
 */
export const loginAPI = (params) => {
  return post('/api/v1/user/login', params);
};
