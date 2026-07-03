const getApiUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL;
  
  // If the environment variable is not defined, or contains the unresolved shell placeholder
  if (!envUrl || envUrl === "${API_URL}" || envUrl.startsWith("${")) {
    if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      return "http://127.0.0.1:8001";
    }
    return ""; // Fallback for production deployment
  }
  
  // Remove trailing slash if present to avoid double-slash issues in endpoints
  if (envUrl.endsWith("/")) {
    envUrl = envUrl.slice(0, -1);
  }
  
  return envUrl;
};

export const API_URL = getApiUrl();
export const WS_URL = API_URL.replace(/^http/, "ws");
