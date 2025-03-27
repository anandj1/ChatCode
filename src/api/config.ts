
// Explicitly define the API base URL with the correct port
export const API_BASE_URL = "https://chat-code-3fz6.onrender.com/api"; // Direct communication with backend

export const buildApiUrl = (path: string): string => {
  // Normalize the path by removing leading slash if present
  const normalizedPath = path.startsWith("/") ? path.substring(1) : path;
  return `${API_BASE_URL}/${normalizedPath}`;
};
