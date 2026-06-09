export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const getDropboxAccessToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dropbox_access_token");
};

export const authHeaders = () => {
  const token = getDropboxAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
