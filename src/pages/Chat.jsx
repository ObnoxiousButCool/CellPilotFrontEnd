// import { useEffect } from "react";
// import { useMsal } from "@azure/msal-react";
// import { loginRequest } from "../auth/msalConfig";

// function Chat() {
//   const { instance } = useMsal();

//   useEffect(() => {
//     const callBackend = async () => {
//       try {
//         const account = instance.getActiveAccount();

//         const response = await instance.acquireTokenSilent({
//           ...loginRequest,
//           account,
//         });

//         const token = response.accessToken;

//         const res = await fetch("http://127.0.0.1:8000/test", {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         const data = await res.json();
//         console.log("Backend response:", data);
//       } catch (err) {
//         console.error("Error calling backend:", err);
//       }
//     };

//     callBackend();
//   }, [instance]);

//   return (
//     <div>
//       <h2>Chat Page</h2>
//     </div>
//   );
// }

// export default Chat;


import { useEffect, useState, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../auth/msalConfig";

function Chat() {
  const { instance } = useMsal();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm CellPilot. How can I help you with your Excel data today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const account = instance.getActiveAccount();
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const token = response.accessToken;

      // Calling your /ask endpoint
      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: input }),
      });

      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || "Data processed successfully." }
      ]);
    } catch (err) {
      console.error("Error calling backend:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Sorry, I encountered an error connecting to the server." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:flex w-64 bg-[#1a1c1e] flex-col border-r border-gray-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-[#217346] rounded-md flex items-center justify-center font-bold text-white text-sm">X</div>
            <span className="font-bold text-gray-100 tracking-tight">CellPilot AI</span>
          </div>
          <button className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors text-left border border-gray-700">
            + New Analysis
          </button>
        </div>
        <div className="mt-auto p-6 border-t border-gray-800">
            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Connected to Excel</div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-10">
          <h2 className="font-semibold text-gray-700">Spreadsheet Assistant</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Powered by</span>
            <span className="px-3 py-1 bg-green-50 text-[#217346] rounded-full text-xs font-black border border-green-100">
              CellPilot
            </span>
          </div>
        </header>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                ? 'bg-[#217346] text-white rounded-tr-none' 
                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 bg-transparent">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to count rows, filter data, or update cells..."
              className="w-full p-4 pr-16 bg-white border border-gray-200 rounded-2xl shadow-xl focus:outline-none focus:border-green-500 transition-all text-sm"
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-2 bottom-2 px-4 bg-[#217346] text-white rounded-xl hover:bg-[#1a5c38] transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
          <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-tighter">
            CellPilot can analyze specific tables and columns in your connected Excel workbook.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Chat;