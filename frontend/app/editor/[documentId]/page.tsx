"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, use } from "react";
import { TEMPLATES } from "@/lib/latex-templates/templates";

// Button component following best practices
interface ButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success';
  size?: 'sm' | 'md';
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

const Button = ({ 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  children,
  className = ''
}: ButtonProps) => {
  const baseStyles = "font-medium rounded-lg transition-colors";
  
  const variantStyles = {
    primary: "text-white bg-black hover:bg-gray-800 disabled:bg-gray-400",
    secondary: "text-black border border-gray-300 hover:bg-gray-50 disabled:border-gray-200",
    success: "text-white bg-black hover:bg-gray-800 disabled:bg-gray-400"
  };
  
  const sizeStyles = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-2 text-sm"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
};

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
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Helper function to extract LaTeX code from AI response
  const extractLatexCode = (text: string): string | null => {
    // Look for code blocks with latex or tex
    const codeBlockRegex = /```(?:latex|tex)?\n([\s\S]*?)\n```/g;
    const matches = [...text.matchAll(codeBlockRegex)];
    
    if (matches.length > 0) {
      // Join all code blocks
      return matches.map(match => match[1]).join('\n\n');
    }
    
    // If no code blocks, check if entire response looks like LaTeX
    if (text.includes('\\documentclass') || text.includes('\\begin{document}')) {
      return text.trim();
    }
    
    return null;
  };

  const handleAiRequest = async (userMessage: string, autoApply: boolean = false) => {
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
          selectedTemplate: selectedTemplate,
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

      // Auto-apply if requested (for format actions)
      if (autoApply) {
        const extractedCode = extractLatexCode(data.response);
        if (extractedCode) {
          setContent(extractedCode);
        }
      }
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

  const handleFormatDocument = async () => {
    const templateName = selectedTemplate ? TEMPLATES[selectedTemplate].name : "standard LaTeX";
    await handleAiRequest(
      `Format my entire document according to ${templateName} guidelines. Keep all my content but restructure it properly with correct packages, structure, and formatting. Return ONLY the complete formatted LaTeX code in a code block, no explanations.`,
      true  // AUTO-APPLY to editor
    );
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) {
      alert("Please select a conference format first");
      return;
    }
    
    await handleAiRequest(
      `Convert my document to ${TEMPLATES[selectedTemplate].name} format. Apply all formatting rules, fix structure, ensure compliance with conference requirements, and maintain all my content. Return ONLY the complete reformatted LaTeX code in a code block without explanations.`,
      true  // AUTO-APPLY to editor
    );
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
          
          {/* Template Selector */}
          <div className="px-6 py-3 border-b border-gray-200 bg-white">
            <label className="text-xs font-medium text-gray-600 uppercase block mb-2">
              Conference Format
            </label>
            <select
              value={selectedTemplate || ""}
              onChange={(e) => setSelectedTemplate(e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            >
              <option value="">General LaTeX</option>
              {Object.values(TEMPLATES).map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <p className="mt-2 text-xs text-gray-500">
                {TEMPLATES[selectedTemplate].description}
              </p>
            )}
          </div>

          {/* Smart Formatting Actions */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-xs font-medium text-gray-600 uppercase mb-2">Smart Formatting</p>
            <div className="space-y-2">
              <button 
                onClick={handleFormatDocument}
                disabled={isLoading}
                className="w-full text-left px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Format Entire Document
              </button>
              <button 
                onClick={handleApplyTemplate}
                disabled={!selectedTemplate || isLoading}
                className="w-full text-left px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Apply Conference Template
              </button>
            </div>
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
                  <div key={idx} className="space-y-2">
                    <div
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
                    
                    {/* Apply to Editor button for AI responses with LaTeX code */}
                    {msg.role === "assistant" && extractLatexCode(msg.content) && (
                      <Button
                        onClick={() => {
                          const code = extractLatexCode(msg.content);
                          if (code) setContent(code);
                        }}
                        variant="success"
                        size="sm"
                      >
                        Apply to Editor
                      </Button>
                    )}
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

