"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, use } from "react";

export default function EditorPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentName = searchParams.get("name") || "Untitled Document";
  
  // Unwrap the params Promise
  const { documentId } = use(params);
  
  const [content, setContent] = useState(
    "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\n\\title{" + documentName + "}\n\\author{}\n\\date{}\n\n\\begin{document}\n\n\\maketitle\n\n\\section{Introduction}\n\nStart writing your content here...\n\n\\end{document}"
  );
  const [aiPrompt, setAiPrompt] = useState("");
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAiRequest = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;
    
    setIsLoading(true);
    
    // Add user message to chat
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setAiPrompt("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          latexContent: content,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response");
      }

      // Add AI response to chat
      setMessages([...newMessages, { 
        role: "assistant", 
        content: data.response 
      }]);
    } catch (error: any) {
      console.error("AI request failed:", error);
      setMessages([...newMessages, { 
        role: "assistant", 
        content: `Sorry, I encountered an error: ${error.message}. Please try again.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (actionType: string) => {
    const prompts: Record<string, string> = {
      equation: "Generate a LaTeX equation template with proper formatting and numbering",
      table: "Create a professional LaTeX table with 3 columns and 5 rows, including header",
      figure: "Generate a complete figure environment with caption and label",
      bibliography: "Show me how to set up a bibliography in LaTeX with BibTeX",
    };
    
    if (prompts[actionType]) {
      await handleAiRequest(prompts[actionType]);
    }
  };

  // Redirect to home if not authenticated
  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/workspace")}
              className="text-gray-600 hover:text-black transition-colors"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-black">{documentName}</h1>
              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                Document ID: {documentId}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-sm text-gray-700 hover:text-black transition-colors">
              Save
            </button>
            <button className="px-4 py-2 text-sm text-gray-700 hover:text-black transition-colors">
              Export PDF
            </button>
            <span className="text-sm text-gray-600">
              {session?.user?.name || session?.user?.email}
            </span>
          </div>
        </div>
      </header>

      {/* Main Editor Area - Split Screen */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - LaTeX Editor */}
        <div className="flex-1 flex flex-col border-r border-gray-200">
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-medium text-gray-700">LaTeX Editor</h2>
          </div>
          <div className="flex-1 p-6 overflow-auto">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full font-mono text-sm text-black bg-white border border-gray-300 rounded-lg p-4 focus:outline-none focus:border-black resize-none"
              placeholder="Write your LaTeX code here..."
              spellCheck={false}
            />
          </div>
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>Lines: {content.split("\n").length}</span>
              <span>Characters: {content.length}</span>
              <span>Words: {content.split(/\s+/).filter(Boolean).length}</span>
            </div>
          </div>
        </div>

        {/* Right Side - AI Help Panel */}
        <div className="w-1/3 flex flex-col bg-gray-50">
          <div className="px-6 py-3 border-b border-gray-200 bg-white">
            <h2 className="text-sm font-medium text-gray-700">AI Assistant</h2>
          </div>
          
          {/* Chat/Help Area */}
          <div className="flex-1 p-6 overflow-auto">
            {messages.length === 0 ? (
              <div className="space-y-4">
                {/* Welcome Message */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-700">
                    👋 Hi! I'm your AI assistant powered by Google Gemini. I can help you with:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>• Writing LaTeX code</li>
                    <li>• Formatting equations</li>
                    <li>• Creating tables and figures</li>
                    <li>• Citation management</li>
                    <li>• Document structuring</li>
                  </ul>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase">Quick Actions</p>
                  <button 
                    onClick={() => handleQuickAction("equation")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    Insert equation template
                  </button>
                  <button 
                    onClick={() => handleQuickAction("table")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    Create table structure
                  </button>
                  <button 
                    onClick={() => handleQuickAction("figure")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    Add figure environment
                  </button>
                  <button 
                    onClick={() => handleQuickAction("bibliography")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    Format bibliography
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${
                      msg.role === "user"
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-500 mb-2">
                      {msg.role === "user" ? "You" : "AI Assistant"}
                    </div>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                      <span className="text-sm text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isLoading && handleAiRequest(aiPrompt)}
                placeholder="Ask AI for help..."
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                disabled={isLoading}
              />
              <button
                onClick={() => handleAiRequest(aiPrompt)}
                disabled={isLoading || !aiPrompt.trim()}
                className="px-4 py-2 text-sm text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

