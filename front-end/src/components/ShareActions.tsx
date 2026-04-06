import type { MouseEvent } from "react";
import { Copy, MessageCircle, Send, Share2 } from "lucide-react";

import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

type ShareActionsProps = {
  title: string;
  text: string;
  url: string;
  label?: string;
  className?: string;
  compact?: boolean;
  align?: "left" | "right";
};

const baseButtonClassName =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary";

const compactButtonClassName =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary";

export default function ShareActions({
  title,
  text,
  url,
  label = "Compartilhar",
  className,
  compact = false,
  align = "left",
}: ShareActionsProps) {
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";
  const buttonClassName = compact ? compactButtonClassName : baseButtonClassName;
  const shareText = `${text} ${url}`.trim();

  const shareTargets = [
    {
      key: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      icon: MessageCircle,
    },
    {
      key: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      icon: Send,
    },
    {
      key: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
  ];

  const stopEvent = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleOpenTarget = (
    event: MouseEvent<HTMLButtonElement>,
    targetUrl: string
  ) => {
    stopEvent(event);
    if (!targetUrl || typeof window === "undefined") {
      return;
    }

    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async (event: MouseEvent<HTMLButtonElement>) => {
    stopEvent(event);

    if (!canNativeShare) {
      return;
    }

    try {
      await navigator.share({ title, text, url });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      toast.error("Nao foi possivel abrir as opcoes de compartilhamento.");
    }
  };

  const handleCopyLink = async (
    event: MouseEvent<HTMLButtonElement>,
    source: "default" | "instagram" = "default"
  ) => {
    stopEvent(event);

    try {
      await copyToClipboard(url);
      toast.success(
        source === "instagram"
          ? "Link copiado para compartilhar no Instagram."
          : "Link copiado com sucesso."
      );
    } catch {
      toast.error("Nao foi possivel copiar o link.");
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        align === "right" ? "items-start sm:items-end" : "items-start",
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>

      <div className="flex flex-wrap gap-2">
        {canNativeShare ? (
          <button
            type="button"
            onClick={handleNativeShare}
            className={buttonClassName}
          >
            <Share2 className="h-3.5 w-3.5" />
            Compartilhar
          </button>
        ) : null}

        {shareTargets.map((target) => (
          <button
            key={target.key}
            type="button"
            onClick={(event) => handleOpenTarget(event, target.href)}
            className={buttonClassName}
          >
            {target.icon ? <target.icon className="h-3.5 w-3.5" /> : null}
            {target.label}
          </button>
        ))}

        <button
          type="button"
          onClick={(event) => handleCopyLink(event, "instagram")}
          className={buttonClassName}
        >
          Instagram
        </button>

        <button
          type="button"
          onClick={(event) => handleCopyLink(event)}
          className={buttonClassName}
        >
          <Copy className="h-3.5 w-3.5" />
          Copiar link
        </button>
      </div>
    </div>
  );
}

async function copyToClipboard(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("clipboard-unavailable");
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";

  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}
