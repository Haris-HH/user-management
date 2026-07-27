/*
  redux-persist storage engine backed by localStorage, with a no-op
  fallback for non-browser environments (SSR / tests) where it is absent.
*/
const hasLocalStorage =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const storage = {
  getItem: (key: string): Promise<string | null> =>
    Promise.resolve(hasLocalStorage ? localStorage.getItem(key) : null),

  setItem: (key: string, value: string): Promise<void> => {
    if (hasLocalStorage) localStorage.setItem(key, value);
    return Promise.resolve();
  },

  removeItem: (key: string): Promise<void> => {
    if (hasLocalStorage) localStorage.removeItem(key);
    return Promise.resolve();
  },
};

export default storage;
