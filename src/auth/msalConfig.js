export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID,
    authority: "https://login.microsoftonline.com/"+import.meta.env.VITE_TENANT_ID,
    redirectUri: import.meta.env.VITE_REDIRECT_URI
  },
  cache: {
    cacheLocation: "sessionStorage", // safer than localStorage
    storeAuthStateInCookie: false
  }
};

export const loginRequest = {
  scopes: [
    "User.Read",
    "Files.ReadWrite.All",
    "Sites.ReadWrite.All"
  ]
};