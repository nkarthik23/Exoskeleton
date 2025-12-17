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
            <div className="space-y-4">
              {/* Welcome Message */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700">
                  👋 Hi! I'm your AI assistant. I can help you with:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Writing LaTeX code</li>
                  <li>• Formatting equations</li>
                  <li>• Creating tables and figures</li>
                  <li>• Citation management</li>
                  <li>• Document structuring</li>
                </ul>
                <p className="mt-3 text-xs text-gray-500 italic">
                  AI functionality coming soon...
                </p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600 uppercase">Quick Actions</p>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                  Insert equation template
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                  Create table structure
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                  Add figure environment
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                  Format bibliography
                </button>
              </div>
            </div>
          </div>

          {/* AI Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask AI for help... (coming soon)"
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                disabled
              />
              <button
                disabled
                className="px-4 py-2 text-sm text-white bg-gray-400 rounded-lg cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

