import request from './index.jsx';

/**
 * Fetch current user info using session cookie set at login.
 * @returns {Promise<APIRes<LoginAPIRes>>}
 */
export const getCurrentUserAPI = () => {
  return request.get('/api/v1/user-info', {
    credentials: 'include'
  });
};
