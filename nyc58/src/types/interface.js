/**
 * @typedef {Object} RegistrationAPIReq
 * @property {string} username
 * @property {string} email
 * @property {string} password
 * @property {string} confirmPassword
 */
/**
 * @typedef {Object} RegistrationAPIRes
 * @property {string} userId
 * @property {string} username
 * @property {string} email
 * @property {string} createdAt
 */
/**
 * @template T
 * @typedef {Object} APIRes
 * @property {boolean} success
 * @property {string} message
 * @property {T} data
 */
/**
 * Immutable template used to seed a registration payload.
 * Always clone (`{ ...registrationRequest, ...formState }`) before mutation.
 */
export const registrationRequest = Object.freeze({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
});