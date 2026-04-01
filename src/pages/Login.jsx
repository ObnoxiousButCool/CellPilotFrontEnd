import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../auth/msalConfig";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] bg-green-50 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[600px] h-[600px] bg-emerald-50 rounded-full blur-3xl opacity-70"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-12 text-center">
          
          {/* App Icon Area - Updated to Excel Green */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-[#217346] rounded-2xl flex items-center justify-center shadow-xl shadow-green-100 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
               <span className="text-white text-4xl font-bold font-mono">X</span>
            </div>
          </div>

          <h1 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">
            CellPilot AI
          </h1>
          <p className="text-gray-500 mb-12 text-lg leading-relaxed">
            Analyze your spreadsheets using natural language.
          </p>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-100 py-4 px-6 rounded-2xl text-gray-700 font-bold hover:border-green-500 hover:bg-green-50 transition-all duration-300 group shadow-sm active:scale-[0.98]"
          >
            {/* Microsoft Logo Grid */}
            <div className="grid grid-cols-2 gap-0.5 w-5 h-5 opacity-90 group-hover:opacity-100">
              <div className="bg-[#f25022] w-2 h-2"></div>
              <div className="bg-[#7fba00] w-2 h-2"></div>
              <div className="bg-[#00a4ef] w-2 h-2"></div>
              <div className="bg-[#ffb900] w-2 h-2"></div>
            </div>
            <span>Continue with Microsoft</span>
          </button>

          <div className="mt-10 pt-8 border-t border-gray-50">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
              Enterprise Data Secure • MSAL 3.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;