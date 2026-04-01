import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../auth/msalConfig";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

// function Login() {
//   const { instance } = useMsal();

//   console.log("Accounts:", instance.getAllAccounts());
//   console.log("Active:", instance.getActiveAccount());

// //   const handleLogin = async () => {
// //   try {
// //     await instance.loginRedirect({
// //       ...loginRequest,
// //       redirectUri: "http://localhost:5173/auth"
// //     });
// //   } catch (error) {
// //     console.error("Login failed:", error);
// //   }
// // };
//   const handleLogin = async () => {
//     try {
//       await instance.loginRedirect(loginRequest);
//     } catch (error) {
//       console.error("Login failed:", error);
//     }
//   };

//   return (
//     <div>
//       <h2>Login Page</h2>
//       <button onClick={handleLogin}>
//         Login with Microsoft
//       </button>
//     </div>
//   );
// }

function Login() {
  const { instance } = useMsal();
  const navigate = useNavigate();

  useEffect(() => {
    const account = instance.getActiveAccount();

    if (account) {
      navigate("/chat");
    }
  }, [instance, navigate]);

  const handleLogin = async () => {
    try {
      await instance.loginRedirect(loginRequest);
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