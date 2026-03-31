import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../auth/msalConfig";

function Login() {
  const { instance } = useMsal();

  const handleLogin = async () => {
  try {
    await instance.loginRedirect({
      ...loginRequest,
      redirectUri: "http://localhost:5173/auth"
    });
  } catch (error) {
    console.error("Login failed:", error);
  }
};

  return (
    <div>
      <h2>Login Page</h2>
      <button onClick={handleLogin}>
        Login with Microsoft
      </button>
    </div>
  );
}

export default Login;