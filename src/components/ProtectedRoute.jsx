// import { Navigate } from "react-router-dom";

// function ProtectedRoute({ children }) {
//   const token = sessionStorage.getItem("access_token");

//   console.log("🔐 Token in ProtectedRoute:", token);

//   if (!token) {
//     console.log("🚫 No token → redirecting");
//     return <Navigate to="/" />;
//   }

//   return children;
// }

// export default ProtectedRoute;


import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem("access_token");

  console.log("🔐 Token in ProtectedRoute:", token);

  if (!token) {
    console.log("🚫 No token → redirecting");
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;