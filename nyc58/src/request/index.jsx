// @ts-check

/**
 * Converts HTTP error code to readable text
 * @param {any} response
 * @returns {string}
 */
const getErrorCode2text = (response) => {
  /** http status code */
  const code = response.status;

  /** notice text */
  let message = 'Request Error';

  switch (code) {
    case 400:
      message = 'Request Error';
      break;
    case 401:
      message = 'Unauthorized, please login';
      break;
    case 403:
      message = 'Access denied';
      break;
    case 404:
      message = 'The access resource does not exist';
      break;
    case 408:
      message = 'Request timeout';
      break;
    case 500:
      message = 'Position error';
      break;
    case 501:
      message = 'The bearer service is not implemented';
      break;
    case 502:
      message = 'Gateway error';
      break;
    case 503:
      message = 'The service is temporarily unavailable';
      break;
    case 504:
      message = 'Gateway timeout';
      break;
    case 505:
      message = 'HTTP version not supported yet';
      break;
    default:
      message = 'Position error';
  }

  return message;
};
