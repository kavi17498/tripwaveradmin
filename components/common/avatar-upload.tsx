"use client";

import React from "react";

type Props = {
  src?: string | null;
  size?: number;
  editable?: boolean;
  onFileSelected?: (file: File | null) => void;
  alt?: string;
};

export const AvatarUpload: React.FC<Props> = ({ src, size = 48, editable = false, onFileSelected, alt = "avatar" }) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    return () => {
      // cleanup object URL if src is blob
      if (src && src.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(src);
        } catch {}
      }
    };
  }, [src]);

  const handleClick = () => {
    if (!editable) return;
    inputRef.current?.click();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (onFileSelected) onFileSelected(file);
  };

  const sizePx = `${size}px`;

  return (
    <div className="relative inline-block" style={{ width: sizePx, height: sizePx }}>
      <div
        role={editable ? "button" : undefined}
        tabIndex={editable ? 0 : -1}
        onKeyDown={(e) => (e.key === "Enter" ? handleClick() : null)}
        onClick={handleClick}
        className="flex items-center justify-center rounded-full bg-slate-100 border border-border overflow-hidden"
        style={{ width: sizePx, height: sizePx }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} style={{ width: sizePx, height: sizePx }} className="object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
            <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 21v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {editable ? (
        <>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div className="absolute -right-1 -bottom-1">
            <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center border border-border text-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AvatarUpload;
