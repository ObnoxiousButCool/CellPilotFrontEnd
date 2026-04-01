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

// export const loginRequest = {
//   scopes: [
//     "User.Read",
//     "Files.ReadWrite.All",
//     "Sites.ReadWrite.All"
//   ]
// };

export const loginRequest = {
  scopes: ["api://0fc195b0-5cbd-4061-954e-3e0b5bbeb081/access_as_user"] 
};