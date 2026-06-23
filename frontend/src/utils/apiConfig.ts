export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const getDropboxAccessToken = () => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("dropbox_access_token");
  if (!token) {
    console.warn("⚠️ No Dropbox access token found in localStorage");
  }
  return token;
};

export const authHeaders = () => {
  const token = getDropboxAccessToken();
  if (!token) {
    console.error("❌ authHeaders called but no token available");
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};
