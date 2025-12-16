"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  const handleLogin = () => {
    signIn("google");
  };

  const handleSignUp = () => {
    signIn("google");
  };

  return (
    <div className="relative min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-8 py-6 bg-white/80 backdrop-blur-sm z-50">
        <div className="text-xl font-medium text-black">Exoskeleton</div>
        <div className="flex gap-3">
          {status === "authenticated" ? (
            <>
              <span className="px-6 py-2 text-sm font-medium text-black">
                {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="px-6 py-2 text-sm font-medium text-black border border-gray-300 square-lg hover:bg-gray-50 transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleLogin}
                className="px-6 py-2 text-sm font-medium text-black border border-gray-300 square-lg hover:bg-gray-50 transition-colors"
              >
                Login
              </button>
              <button
                onClick={handleSignUp}
                className="px-6 py-2 text-sm font-medium text-white bg-black square-lg hover:bg-gray-800 transition-colors"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex min-h-screen flex-col items-center justify-center px-8">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-7xl sm:text-8xl md:text-7xl font-light tracking-tight text-black mb-6">
            Exoskeleton
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-12">
            Where research meets intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSignUp}
              className="px-8 py-3 text-base font-medium text-white bg-black square-lg hover:bg-gray-800 transition-colors"
            >
              Get Started
            </button>
            <button className="px-8 py-3 text-base font-medium text-black border border-gray-300 square-lg hover:bg-gray-50 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </main>

      {/* Help Button */}
      <button className="fixed bottom-8 right-8 w-12 h-12 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-lg">
        <span className="text-xl">?</span>
      </button>
    </div>
  );
}
