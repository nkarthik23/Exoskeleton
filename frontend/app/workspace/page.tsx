"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WorkspacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [documentName, setDocumentName] = useState("");

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

  const handleCreateDocument = () => {
    if (documentName.trim()) {
      // Generate a simple ID for the document
      const docId = Date.now().toString();
      router.push(`/editor/${docId}?name=${encodeURIComponent(documentName)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-black">Exoskeleton</h1>
            <span className="text-sm text-gray-500">Project Workspace</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {session?.user?.name || session?.user?.email}
            </span>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-light text-black mb-2">
            Welcome to your workspace
          </h2>
          <p className="text-gray-600">
            Create and manage your LaTeX documents with AI assistance.
          </p>
        </div>

        {/* Create New Document Card */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => setShowModal(true)}
            className="group h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-black hover:bg-gray-50 transition-all"
          >
            <div className="text-4xl text-gray-400 group-hover:text-black transition-colors mb-4">
              +
            </div>
            <div className="text-lg font-medium text-gray-700 group-hover:text-black transition-colors">
              Create New Document
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Start a new LaTeX project
            </div>
          </button>

          {/* Placeholder for existing documents */}
          <div className="h-64 flex flex-col border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex-1">
              <div className="text-lg font-medium text-black mb-2">
                Sample Document
              </div>
              <div className="text-sm text-gray-500">
                Last edited: Today
              </div>
            </div>
            <div className="flex gap-2">
              <button className="text-sm text-gray-600 hover:text-black transition-colors">
                Open
              </button>
              <button className="text-sm text-gray-600 hover:text-black transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Create Document Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-semibold text-black mb-4">
              Create New Document
            </h3>
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Enter document name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black mb-6"
              onKeyPress={(e) => e.key === "Enter" && handleCreateDocument()}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleCreateDocument}
                disabled={!documentName.trim()}
                className="flex-1 px-6 py-3 text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setDocumentName("");
                }}
                className="flex-1 px-6 py-3 text-black border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

