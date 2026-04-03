import { useEffect, useState, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../auth/msalConfig";

function Chat() {
  const { instance } = useMsal();
  
  // --- State Management ---
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm CellPilot. Click '+ New Project' to connect a SharePoint folder or Excel file." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // File Explorer States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [explorerItems, setExplorerItems] = useState([]); // List of files/folders
  const [currentDrive, setCurrentDrive] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); // {drive_id, item_id, name}
  const [history, setHistory] = useState([]); // For breadcrumbs/back navigation
  const [error, setError] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const selectProject = async (projectId) => {
      setActiveProjectId(projectId);
      setIsLoading(true);
      
      const account = instance.getActiveAccount();
      const auth = await instance.acquireTokenSilent({ ...loginRequest, account });

      // Pull history from DB
      const res = await fetch(`http://127.0.0.1:8000/projects/${projectId}/messages`, {
          headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      const history = await res.json();
      
      // Set the messages state to the DB history
      setMessages(history);
      setIsLoading(false);
  };

  // --- Logic: Resolve Initial URL ---
  const handleResolveURL = async () => {
    setError("");
    setIsLoading(true);
    try {
      const account = instance.getActiveAccount();
      const auth = await instance.acquireTokenSilent({ ...loginRequest, account });
      
      const res = await fetch(`http://127.0.0.1:8000/resolve-sharepoint?url=${encodeURIComponent(urlInput)}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Access Denied");

      const driveId = data.parentReference.driveId;
      setCurrentDrive(driveId);

      if (data.folder) {
        fetchFolder(driveId, data.id, data.name);
      } else {
        // If it's a file, select it directly
        setSelectedFile({ drive_id: driveId, item_id: data.id, name: data.name });
        setMessages([{ role: "assistant", content: `Connected to **${data.name}**. How can I help you analyze this data?` }]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Logic: Fetch Folder Contents ---
  const fetchFolder = async (driveId, itemId, folderName) => {
    setError("");
    try {
      const account = instance.getActiveAccount();
      const auth = await instance.acquireTokenSilent({ ...loginRequest, account });

      const res = await fetch(`http://127.0.0.1:8000/list-folder?drive_id=${driveId}&item_id=${itemId}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Cannot access folder");

      setExplorerItems(data.value);
      setHistory(prev => [...prev, { id: itemId, name: folderName }]);
      setSelectedFile(null); // Clear selection while browsing
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFile({ drive_id: currentDrive, item_id: file.id, name: file.name });
    setMessages([{ role: "assistant", content: `Connected to **${file.name}**. I'm ready to answer questions about this spreadsheet.` }]);
    setExplorerItems([]); // Close explorer view
  };

  // --- Logic: Send Message ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedFile) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const account = instance.getActiveAccount();
      const auth = await instance.acquireTokenSilent({ ...loginRequest, account });

      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ 
            query: input,
            drive_id: selectedFile.drive_id,
            item_id: selectedFile.item_id
        }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response || "No response" }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Connection error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
      {/* Sidebar */}
      <div className="hidden md:flex w-64 bg-[#1a1c1e] flex-col border-r border-gray-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-[#217346] rounded-md flex items-center justify-center font-bold text-white text-sm">X</div>
            <span className="font-bold text-gray-100 tracking-tight">CellPilot AI</span>
          </div>
          <button 
            onClick={() => { setIsModalOpen(true); setUrlInput(""); setError(""); }}
            className="w-full py-2.5 px-4 bg-[#217346] hover:bg-[#1a5c38] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-900/20"
          >
            + New Project
          </button>
        </div>
        <div className="mt-auto p-6 border-t border-gray-800 text-xs text-gray-500 font-medium">
            {selectedFile ? `Active: ${selectedFile.name}` : "No file connected"}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-700">Spreadsheet Assistant</h2>
            {selectedFile && <span className="bg-green-100 text-[#217346] text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Live</span>}
          </div>
          <span className="px-3 py-1 bg-green-50 text-[#217346] rounded-full text-xs font-black border border-green-100">CellPilot</span>
        </header>

        {/* File Explorer View (Conditional) */}
        {explorerItems.length > 0 && !selectedFile && (
          <div className="flex-1 p-8 overflow-y-auto bg-gray-50 z-10">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">SharePoint Browser</h3>
                    <button onClick={() => setExplorerItems([])} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
                
                {/* Breadcrumbs */}
                <div className="flex gap-2 mb-4 text-sm text-gray-500">
                    {history.map((h, i) => (
                        <span key={i} className="flex gap-2">
                            <span className="hover:underline cursor-pointer">{h.name}</span>
                            {i < history.length - 1 && <span>/</span>}
                        </span>
                    ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y">
                    {explorerItems.map(item => (
                        <div 
                            key={item.id}
                            onClick={() => item.folder ? fetchFolder(currentDrive, item.id, item.name) : handleFileSelect(item)}
                            className="flex items-center gap-4 p-4 hover:bg-green-50 cursor-pointer transition-colors group"
                        >
                            <span className="text-2xl">{item.folder ? "📁" : "📊"}</span>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-700 group-hover:text-[#217346]">{item.name}</p>
                                <p className="text-xs text-gray-400">{item.folder ? "Folder" : "Excel Spreadsheet"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar ${(explorerItems.length > 0 && !selectedFile) ? 'hidden' : 'block'}`}>
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm break-words overflow-hidden whitespace-pre-wrap ${
                msg.role === 'user' ? 'bg-[#217346] text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && !isModalOpen && (
             <div className="flex justify-start">
               <div className="bg-white border border-gray-100 p-4 rounded-2xl animate-pulse text-xs text-gray-400 font-bold uppercase tracking-widest">Processing...</div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className={`p-4 md:p-8 bg-transparent transition-opacity ${(!selectedFile || explorerItems.length > 0) ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedFile ? `Ask about ${selectedFile.name}...` : "Connect a file to start..."}
              className="w-full p-4 pr-16 bg-white border border-gray-200 rounded-2xl shadow-xl focus:outline-none focus:border-green-500 text-sm"
            />
            <button type="submit" disabled={isLoading} className="absolute right-2 top-2 bottom-2 px-4 bg-[#217346] text-white rounded-xl hover:bg-[#1a5c38]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </form>
        </div>
      </div>

      {/* --- New Project Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">New Analysis Project</h3>
            <p className="text-gray-500 text-sm mb-6">Paste a SharePoint folder or Excel file link to begin.</p>
            
            <input 
              className="w-full p-4 border border-gray-200 rounded-2xl mb-4 focus:border-green-500 outline-none transition-all"
              placeholder="https://company.sharepoint.com/..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />

            {error && <p className="text-red-500 text-xs mb-4 font-bold">❌ {error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
              <button 
                onClick={handleResolveURL}
                disabled={isLoading || !urlInput}
                className="flex-1 py-3 bg-[#217346] text-white font-bold rounded-xl hover:bg-[#1a5c38] transition-all disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Connect Source"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;




/// new code

// import { useEffect, useState, useRef } from "react";
// import { useMsal } from "@azure/msal-react";
// import { loginRequest } from "../auth/msalConfig";

// function Chat() {
//   const { instance } = useMsal();
  
//   // --- State Management ---
//   const [projects, setProjects] = useState([]); // List of projects from DB
//   const [activeProjectId, setActiveProjectId] = useState(null);
//   const [messages, setMessages] = useState([
//     { role: "assistant", content: "Hello! I'm CellPilot. Click '+ New Project' to begin." }
//   ]);
//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const messagesEndRef = useRef(null);

//   // File Explorer States
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [urlInput, setUrlInput] = useState("");
//   const [explorerItems, setExplorerItems] = useState([]);
//   const [currentDrive, setCurrentDrive] = useState(null);
//   const [selectedFile, setSelectedFile] = useState(null); 
//   const [history, setHistory] = useState([]);
//   const [error, setError] = useState("");

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // --- NEW: Load all projects on mount ---
//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         const account = instance.getActiveAccount();
//         const auth = await instance.acquireTokenSilent({ ...loginRequest, account });
//         const res = await fetch("http://127.0.0.1:8000/my-projects", {
//           headers: { Authorization: `Bearer ${auth.accessToken}` },
//         });
//         const data = await res.json();
//         setProjects(data);
//       } catch (err) {
//         console.error("Failed to load projects", err);
//       }
//     };
//     fetchProjects();
//   }, [instance]);

//   // --- NEW: Switch Projects & Load History ---
//   const selectProject = async (project) => {
//     setActiveProjectId(project.id);
//     setSelectedFile({ drive_id: project.drive_id, item_id: project.item_id, name: project.name });
//     setExplorerItems([]); // Close explorer if open
//     setIsLoading(true);
    
//     try {
//       const account = instance.getActiveAccount();
//       const auth = await instance.acquireTokenSilent({ ...loginRequest, account });

//       const res = await fetch(`http://127.0.0.1:8000/projects/${project.id}/messages`, {
//           headers: { Authorization: `Bearer ${auth.accessToken}` }
//       });
//       const chatHistory = await res.json();
//       setMessages(chatHistory.length > 0 ? chatHistory : [{ role: "assistant", content: `Connected to ${project.name}.` }]);
//     } catch (err) {
//       console.error("History fetch failed", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // --- Logic: Resolve & Save Project to DB ---
//   const handleResolveURL = async () => {
//     setError("");
//     setIsLoading(true);
//     try {
//       const account = instance.getActiveAccount();
//       const auth = await instance.acquireTokenSilent({ ...loginRequest, account });
      
//       const res = await fetch(`http://127.0.0.1:8000/resolve-sharepoint?url=${encodeURIComponent(urlInput)}`, {
//         headers: { Authorization: `Bearer ${auth.accessToken}` },
//       });
      
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.detail || "Access Denied");

//       const driveId = data.parentReference.driveId;
//       setCurrentDrive(driveId);

//       if (data.folder) {
//         fetchFolder(driveId, data.id, data.name);
//       } else {
//         // Automatically save this file as a project in DB
//         saveProjectToDB(driveId, data.id, data.name);
//       }
//       setIsModalOpen(false);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const saveProjectToDB = async (driveId, itemId, fileName) => {
//     try {
//       const account = instance.getActiveAccount();
//       const auth = await instance.acquireTokenSilent({ ...loginRequest, account });
      
//       const res = await fetch("http://127.0.0.1:8000/create-project", {
//         method: "POST",
//         headers: { 
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${auth.accessToken}` 
//         },
//         body: JSON.stringify({ drive_id: driveId, item_id: itemId, name: fileName })
//       });
//       const newProject = await res.json();
//       setProjects(prev => [newProject, ...prev]);
//       selectProject(newProject);
//     } catch (err) {
//       console.error("Project creation failed", err);
//     }
//   };

//   // --- Logic: Fetch Folder Contents ---
//   const fetchFolder = async (driveId, itemId, folderName) => {
//     setError("");
//     try {
//       const account = instance.getActiveAccount();
//       const auth = await instance.acquireTokenSilent({ ...loginRequest, account });
//       const res = await fetch(`http://127.0.0.1:8000/list-folder?drive_id=${driveId}&item_id=${itemId}`, {
//         headers: { Authorization: `Bearer ${auth.accessToken}` },
//       });
//       const data = await res.json();
//       setExplorerItems(data.value);
//       setHistory(prev => [...prev, { id: itemId, name: folderName }]);
//     } catch (err) {
//       alert(err.message);
//     }
//   };

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!input.trim() || !activeProjectId) return;

//     const userMessage = { role: "user", content: input };
//     setMessages((prev) => [...prev, userMessage]);
//     setInput("");
//     setIsLoading(true);

//     try {
//       const account = instance.getActiveAccount();
//       const auth = await instance.acquireTokenSilent({ ...loginRequest, account });

//       const res = await fetch("http://127.0.0.1:8000/ask", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${auth.accessToken}`,
//         },
//         body: JSON.stringify({ 
//             query: input,
//             drive_id: selectedFile.drive_id,
//             item_id: selectedFile.item_id,
//             project_id: activeProjectId // Pass DB ID
//         }),
//       });

//       const data = await res.json();
//       setMessages((prev) => [...prev, { role: "assistant", content: data.response || "No response" }]);
//     } catch (err) {
//       setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Connection error." }]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
//       {/* Sidebar */}
//       <div className="hidden md:flex w-72 bg-[#1a1c1e] flex-col border-r border-gray-800">
//         <div className="p-6">
//           <div className="flex items-center gap-3 mb-8">
//             <div className="w-8 h-8 bg-[#217346] rounded-md flex items-center justify-center font-bold text-white text-sm">X</div>
//             <span className="font-bold text-gray-100 tracking-tight">CellPilot AI</span>
//           </div>
//           <button 
//             onClick={() => { setIsModalOpen(true); setUrlInput(""); setError(""); }}
//             className="w-full py-2.5 px-4 bg-[#217346] hover:bg-[#1a5c38] text-white rounded-xl text-sm font-bold transition-all shadow-lg"
//           >
//             + New Project
//           </button>
//         </div>

//         {/* Project List */}
//         <div className="flex-1 overflow-y-auto px-4 space-y-2">
//             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">Recent Analysis</p>
//             {projects.map(project => (
//                 <button
//                     key={project.id}
//                     onClick={() => selectProject(project)}
//                     className={`w-full text-left p-3 rounded-xl text-sm transition-all flex items-center gap-3 ${
//                         activeProjectId === project.id 
//                         ? 'bg-gray-800 text-green-400 border border-gray-700' 
//                         : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
//                     }`}
//                 >
//                     <span className="text-xs">📊</span>
//                     <span className="truncate flex-1">{project.name}</span>
//                 </button>
//             ))}
//         </div>
//       </div>

//       {/* Main Content Area */}
//       <div className="flex-1 flex flex-col relative min-w-0">
//         <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-20">
//           <h2 className="font-semibold text-gray-700">
//             {selectedFile ? selectedFile.name : "Select a Project"}
//           </h2>
//           <span className="px-3 py-1 bg-green-50 text-[#217346] rounded-full text-xs font-black">CellPilot</span>
//         </header>

//         {/* Explorer View */}
//         {explorerItems.length > 0 && !selectedFile && (
//           <div className="flex-1 p-8 overflow-y-auto bg-gray-50 z-10">
//             <div className="max-w-4xl mx-auto">
//                 <div className="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y">
//                     {explorerItems.map(item => (
//                         <div 
//                             key={item.id}
//                             onClick={() => item.folder ? fetchFolder(currentDrive, item.id, item.name) : saveProjectToDB(currentDrive, item.id, item.name)}
//                             className="flex items-center gap-4 p-4 hover:bg-green-50 cursor-pointer"
//                         >
//                             <span>{item.folder ? "📁" : "📊"}</span>
//                             <p className="font-semibold text-gray-700">{item.name}</p>
//                         </div>
//                     ))}
//                 </div>
//             </div>
//           </div>
//         )}

//         {/* Chat Area */}
//         <div className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-6 ${(explorerItems.length > 0 && !selectedFile) ? 'hidden' : 'block'}`}>
//           {messages.map((msg, index) => (
//             <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
//               <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm break-words ${
//                 msg.role === 'user' ? 'bg-[#217346] text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'
//               }`}>
//                 <p className="text-sm">{msg.content}</p>
//               </div>
//             </div>
//           ))}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input Bar */}
//         <div className={`p-4 md:p-8 ${!activeProjectId ? 'opacity-20 pointer-events-none' : ''}`}>
//           <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
//             <input
//               type="text"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Ask a question..."
//               className="w-full p-4 pr-16 bg-white border border-gray-200 rounded-2xl shadow-xl outline-none"
//             />
//             <button type="submit" className="absolute right-2 top-2 bottom-2 px-4 bg-[#217346] text-white rounded-xl">Send</button>
//           </form>
//         </div>
//       </div>

//       {/* Modal for URL */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
//           <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
//             <h3 className="text-xl font-bold mb-4">Start New Analysis</h3>
//             <input 
//               className="w-full p-4 border rounded-2xl mb-4"
//               placeholder="SharePoint Folder URL..."
//               value={urlInput}
//               onChange={(e) => setUrlInput(e.target.value)}
//             />
//             <div className="flex gap-2">
//               <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-400">Cancel</button>
//               <button onClick={handleResolveURL} className="flex-1 py-3 bg-[#217346] text-white rounded-xl font-bold">Connect</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Chat;