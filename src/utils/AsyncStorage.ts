/**
 * Web replacement for React Native AsyncStorage.
 * Keeps the same async interface used by the mobile code.
 */
export async function setItem(key: string, value: string) {
  localStorage.setItem(key, value);
}

export async function getItem(key: string) {
  return localStorage.getItem(key) ?? "";
}

export async function removeItem(key: string) {
  localStorage.removeItem(key);
}
