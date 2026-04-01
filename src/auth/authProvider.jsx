import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./msalConfig";
import { useEffect, useState } from "react";

const msalInstance = new PublicClientApplication(msalConfig);

// export function AuthProvider({ children }) {
//   const [initialized, setInitialized] = useState(false);

//   useEffect(() => {
//     const init = async () => {
//       await msalInstance.initialize();

//       // 🔥 IMPORTANT: handle redirect BEFORE app loads
//       const response = await msalInstance.handleRedirectPromise();

//       if (response) {
//         console.log("🔥 Redirect handled in provider:", response);

//         sessionStorage.setItem("access_token", response.accessToken);
//         sessionStorage.setItem("user", JSON.stringify(response.account));

//         // 👉 force redirect manually
//         // window.location.href = "/chat";
//         return;
//       }

//       setInitialized(true);
//     };

//     init();
//   }, []);

//   if (!initialized) {
//     return <div>Initializing...</div>;
//   }

//   return (
//     <MsalProvider instance={msalInstance}>
//       {children}
//     </MsalProvider>
//   );
// }

export function AuthProvider({ children }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await msalInstance.initialize();

      try {
        const response = await msalInstance.handleRedirectPromise();

        if (response) {
          console.log("🔥 Redirect handled:", response);

          sessionStorage.setItem("access_token", response.accessToken);
          sessionStorage.setItem("user", JSON.stringify(response.account));
          msalInstance.setActiveAccount(response.account);
        }
        else{
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            msalInstance.setActiveAccount(accounts[0]);
          }
        }
      } catch (err) {
        console.error("MSAL redirect error:", err);
      }

      setInitialized(true);
    };

    init();
  }, []);

  if (!initialized) {
    return <div>Initializing...</div>;
  }

  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
}