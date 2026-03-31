import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Chat from "../pages/Chat";
import AuthCallback from "../pages/AuthCallback";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/auth" element={<AuthCallback />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;