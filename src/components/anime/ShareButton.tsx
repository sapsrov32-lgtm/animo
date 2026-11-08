'use client';

import { useState, useRef, useEffect } from 'react';

interface ShareButtonProps {
  title: string;
  description?: string;
  url?: string;
  className?: string;
  variant?: 'pill' | 'icon';
}

export function ShareButton({
  title,
  description,
  url,
  className = '',
  variant = 'pill',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return url || window.location.href;
    }
    return url || '';
  };

  const handleShareClick = async () => {
    const shareUrl = getShareUrl();
    const shareText = description ? `${title} — ${description.slice(0, 120)}...` : title;

    // Use Web Share API if available on mobile/supported platforms
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        // User cancelled or share failed, fallback to dropdown
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: toggle custom dropdown menu
    setDropdownOpen((prev) => !prev);
  };

  const handleCopyLink = async () => {
    const shareUrl = getShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setDropdownOpen(false);
      }, 2000);
    } catch {
      // Fallback
    }
  };

  const shareUrl = getShareUrl();
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(`${title} — Анимо трекер`);

  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
  const vkUrl = `https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {variant === 'pill' ? (
        <button
          type="button"
          onClick={handleShareClick}
          aria-label="Поделиться"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface border border-outline-variant/30 font-label-md text-label-md transition-all active:scale-95 shadow-sm ${className}`}
        >
          <span className="material-symbols-outlined text-[18px] text-primary">
            {copied ? 'done' : 'share'}
          </span>
          <span>{copied ? 'Скопировано!' : 'Поделиться'}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleShareClick}
          aria-label="Поделиться"
          className={`w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface border border-outline-variant/30 flex items-center justify-center transition-all active:scale-95 shadow-sm ${className}`}
          title="Поделиться"
        >
          <span className="material-symbols-outlined text-[20px] text-primary">
            {copied ? 'done' : 'share'}
          </span>
        </button>
      )}

      {/* Share Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-container-low/95 backdrop-blur-xl border border-outline-variant/30 shadow-2xl p-2 z-50 animate-fadeIn text-sm">
          <div className="px-3 py-1.5 text-xs text-outline font-semibold border-b border-outline-variant/20 mb-1">
            Поделиться тайтлом
          </div>

          {/* Copy link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-on-surface hover:bg-surface-container transition-colors text-left"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">
              {copied ? 'check_circle' : 'content_copy'}
            </span>
            <span className="font-medium">
              {copied ? 'Ссылка скопирована!' : 'Скопировать ссылку'}
            </span>
          </button>

          {/* Telegram */}
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setDropdownOpen(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-[#229ED9]">
              send
            </span>
            <span className="font-medium">Telegram</span>
          </a>

          {/* VK */}
          <a
            href={vkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setDropdownOpen(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-[#0077FF]">
              forum
            </span>
            <span className="font-medium">ВКонтакте</span>
          </a>

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setDropdownOpen(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-[#25D366]">
              chat
            </span>
            <span className="font-medium">WhatsApp</span>
          </a>
        </div>
      )}
    </div>
  );
}
