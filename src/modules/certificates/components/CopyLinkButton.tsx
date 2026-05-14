"use client";

import { useState } from "react";

export function CopyLinkButton({ verifyCode }: { verifyCode: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/verify/${verifyCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-1 text-sm bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 py-2 rounded-lg transition-colors"
    >
      {copied ? "¡Copiado! ✓" : "Copiar enlace"}
    </button>
  );
}
