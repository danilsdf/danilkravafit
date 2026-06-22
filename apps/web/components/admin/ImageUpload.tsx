"use client";

import { useRef, useState } from "react";

export function ImageUpload({
  value,
  onChange,
}: Readonly<{
  value: string;
  onChange: (url: string) => void;
}>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      const { secure_url } = await res.json();
      onChange(secure_url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label
        htmlFor="image-upload-input"
        className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5"
      >
        Image
      </label>

      {/* Preview */}
      {value && (
        <div className="mb-2 rounded-lg overflow-hidden border border-white/10 w-full max-h-48 flex items-center justify-center bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="object-contain max-h-48 w-full" />
        </div>
      )}

      {/* Drop zone / click area */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-5 cursor-pointer hover:border-white/40 transition"
      >
        {uploading ? (
          <span className="text-sm text-white/50">Uploading…</span>
        ) : (
          <>
            <span className="text-sm text-white/50">
              {value ? "Replace image" : "Click or drag & drop to upload"}
            </span>
            <span className="text-xs text-white/25">JPG, PNG, WebP, GIF</span>
          </>
        )}
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        id="image-upload-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {/* Manual URL fallback */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste a URL…"
        className="mt-2 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition"
      />

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
