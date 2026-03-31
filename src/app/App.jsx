import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Chat from "../pages/Chat";
import AuthCallback from "../pages/AuthCallback";
import ProtectedRoute from "../components/ProtectedRoute";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/auth" element={<AuthCallback />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;