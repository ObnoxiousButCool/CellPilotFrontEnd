import { useEffect } from "react";

function Chat() {
  const token = sessionStorage.getItem("access_token");

  useEffect(() => {
    const callBackend = async () => {
      try {
        const res = await fetch("http://localhost:8000/test", {
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
  }, []);

  return (
    <div>
      <h2>Chat Page</h2>
    </div>
  );
}

export default Chat;