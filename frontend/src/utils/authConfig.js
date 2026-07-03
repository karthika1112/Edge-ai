// Azure Entra ID / Microsoft SSO Configuration Parameters
export const msalConfig = {
  auth: {
    clientId: "3bf81d2a-e160-496a-b285-cfdb59a35e4d", // Mock Client ID
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin + "/login",
    authorizeEndpoint: window.location.origin + "/microsoft-login", // Pointing to local simulated portal
    scopes: ["openid", "profile", "user.read"]
  }
};
