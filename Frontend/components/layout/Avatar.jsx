"use client";
import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
const getInitials = (user) => {
  const source = user?.fullName || user?.email || "?";
  const parts = source.trim().split(/\s+/);
  const initials =
    parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return initials.toUpperCase();
};
export default function Avatar({ size = 36, editable = true }) {
  const { user, refresh } = useAuth();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  if (!user) return null;
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      await api.uploadAvatar(file);
      await refresh();
    } catch (err) {
      setError("We could not update your profile photo. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUploading(false);
    }
  };
  const dimension = `${size}px`;
  return (
    <div className="relative">

      <button
        type="button"
        onClick={() => editable && inputRef.current?.click()}
        disabled={!editable || uploading}
        aria-label={editable ? "Change profile photo" : "Profile photo"}
        className={`focus-ring group relative overflow-hidden rounded-full border border-edge bg-azure-500/10 transition ${editable ? "cursor-pointer hover:scale-105 hover:border-azure-500/60 active:scale-95" : ""}`}
        style={{ width: dimension, height: dimension }}
      >

        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="grid h-full w-full place-items-center font-display font-bold text-azure-500"
            style={{ fontSize: size * 0.38 }}
          >

            {getInitials(user)}
          </span>
        )}
        {editable && (
          <span className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">

            {uploading ? (
              <Loader2 size={size * 0.4} className="animate-spin text-white" />
            ) : (
              <Camera size={size * 0.4} className="text-white" />
            )}
          </span>
        )}
      </button>
      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      )}
      {error && (
        <p className="absolute right-0 top-full z-10 mt-1.5 w-40 rounded-lg border border-red-400/30 bg-surface px-2.5 py-1.5 text-[11px] text-red-400 shadow-glow">

          {error}
        </p>
      )}
    </div>
  );
}
