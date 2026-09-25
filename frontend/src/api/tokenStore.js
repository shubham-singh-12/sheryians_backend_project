// Simple in-memory store for the short-lived access token.
// We deliberately do NOT persist the access token in localStorage to reduce
// exposure to XSS. The refresh token lives only in an httpOnly cookie set by
// the server, which the browser sends automatically on requests to the API.

let accessToken = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const clearAccessToken = () => {
  accessToken = null;
};
