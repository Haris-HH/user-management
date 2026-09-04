/*
  The access token used to live in localStorage, which is readable by any
  script running on the page - a stored XSS could exfiltrate it directly.
  Keeping it only in a module-level variable removes that surface: it never
  touches disk and disappears on a hard reload. The refresh token stays out
  of JS entirely (httpOnly cookie, see fetchClient's refresh call), so a
  reload can silently recover a session via restoreSession() below instead
  of forcing a fresh login.
*/
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
