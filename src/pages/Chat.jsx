import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../auth/msalConfig";

function Chat() {
  const { instance } = useMsal();

  useEffect(() => {
    const callBackend = async () => {
      try {
        const account = instance.getActiveAccount();

        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account,
        });

        const token = response.accessToken;

        const res = await fetch("http://127.0.0.1:8000/test", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        console.log("Backend response:", data);
      } catch (err) {
        console.error("Error calling backend:", err);
      }
    };

    callBackend();
  }, [instance]);

  return (
    <div>
      <h2>Chat Page</h2>
    </div>
  );
}

export default Chat;