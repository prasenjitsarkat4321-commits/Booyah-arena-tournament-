import React, { useState } from 'react';
import { Key, Copy, Check, X, ExternalLink, Flame, ShieldAlert } from 'lucide-react';
import { AppNotification } from '../types/tournament';
import { Language, pickLocalized } from '../utils/translations';

interface NotificationToastProps {
  notification: AppNotification | null;
  lang: Language;
  onClose: () => void;
  onOpenMatch: (tournamentId: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  lang,
  onClose,
  onOpenMatch,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  if (!notification) return null;

  const handleCopyId = () => {
    if (notification.roomId) {
      navigator.clipboard.writeText(notification.roomId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyPass = () => {
    if (notification.roomPassword) {
      navigator.clipboard.writeText(notification.roomPassword);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <div className="fixed top-20 right-3 sm:right-6 z-50 max-w-sm sm:max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="relative rounded-2xl bg-zinc-950/95 border-2 border-orange-500/80 shadow-2xl shadow-orange-500/25 p-4 sm:p-5 backdrop-blur-md">
        
        {/* Glow accent */}
        <div className="absolute -top-1 -right-1 w-20 h-20 bg-orange-500/20 rounded-full blur-xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-zinc-950 flex items-center justify-center font-bold shadow-md shadow-orange-500/30 animate-bounce">
              <Key className="w-4 h-4 text-zinc-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-orange-400">
                  {pickLocalized(
                    lang,
                    '🚨 LIVE ROOM ALERT',
                    '🚨 लाइव रूम अलर्ट',
                    '🚨 লাইভ রুম অ্যালার্ট'
                  )}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h4 className="font-heading font-extrabold text-sm sm:text-base text-white line-clamp-1">
                {lang === 'hi' ? notification.titleHi : notification.title}
              </h4>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs text-zinc-300 leading-relaxed mb-3">
          {lang === 'hi' ? notification.messageHi : notification.message}
        </p>

        {/* Credentials Box if available */}
        {(notification.roomId || notification.roomPassword) && (
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 mb-3">
            {notification.roomId && (
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="overflow-hidden">
                  <div className="text-[9px] font-mono text-zinc-500 uppercase">Room ID</div>
                  <div className="text-xs font-mono font-bold text-white truncate">
                    {notification.roomId}
                  </div>
                </div>
                <button
                  onClick={handleCopyId}
                  className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 transition-colors ml-1 shrink-0"
                  title="Copy Room ID"
                >
                  {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}

            {notification.roomPassword && (
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="overflow-hidden">
                  <div className="text-[9px] font-mono text-zinc-500 uppercase">Password</div>
                  <div className="text-xs font-mono font-bold text-amber-400 truncate">
                    {notification.roomPassword}
                  </div>
                </div>
                <button
                  onClick={handleCopyPass}
                  className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 transition-colors ml-1 shrink-0"
                  title="Copy Password"
                >
                  {copiedPass ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <span className="text-[10px] text-zinc-500 font-mono">
            {notification.timestamp}
          </span>

          <button
            onClick={() => {
              onOpenMatch(notification.tournamentId);
              onClose();
            }}
            className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 text-xs font-heading font-bold flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/20 whitespace-nowrap"
          >
            <span>
              {pickLocalized(lang, 'View Match Pass', 'मैच टिकट देखें', 'ম্যাচ পাস দেখুন')}
            </span>
            <ExternalLink className="w-3 h-3 text-zinc-950" />
          </button>
        </div>

      </div>
    </div>
  );
};
