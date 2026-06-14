import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'cc_session_id';

// Gets the existing session ID or creates a new one
// This persists across page reloads — the guest cart lives as long as this ID does
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

export const clearSessionId = (): void => {
  localStorage.removeItem(SESSION_KEY);
};
