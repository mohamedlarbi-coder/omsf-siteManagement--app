import React, { useState } from "react";
import { supabase } from "./supabaseClient.js";
import logoIcon from "./logo-icon.png";

export default function Login({ onSignedIn }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!supabase) {
      setError("Supabase isn't configured on this deployment yet (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, position } },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          onSignedIn(data.session.user);
        } else {
          setInfo("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onSignedIn(data.user);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2.5 mb-6">
          <img src={logoIcon} alt="OMSF Field" className="w-9 h-9 rounded-md object-cover" />
          <div>
            <div className="font-medium text-gray-900">OMSF Field</div>
            <div className="text-xs text-gray-400">{mode === "signup" ? "Create an account" : "Sign in to continue"}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="Mohamed Larbi" />
            </div>
          )}
          {mode === "signup" && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Position</label>
              <input value={position} onChange={(e) => setPosition(e.target.value)} required list="position-options"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="e.g. Senior Superintendent" />
              <datalist id="position-options">
                <option value="Senior Superintendent" />
                <option value="Superintendent" />
                <option value="General Superintendent" />
                <option value="Project Manager" />
                <option value="Foreperson" />
                <option value="Subcontractor" />
                <option value="Quality / Safety" />
              </datalist>
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="you@company.com" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="••••••••" />
          </div>

          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</div>}
          {info && <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">{info}</div>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white text-sm py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="text-xs text-gray-500 text-center mt-4">
          {mode === "signup" ? (
            <>Already have an account? <button onClick={() => setMode("signin")} className="text-blue-600 hover:underline">Sign in</button></>
          ) : (
            <>New here? <button onClick={() => setMode("signup")} className="text-blue-600 hover:underline">Create an account</button></>
          )}
        </div>
      </div>
    </div>
  );
}
