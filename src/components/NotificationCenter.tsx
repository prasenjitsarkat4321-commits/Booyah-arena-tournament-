import React, { useState } from 'react';
import { Bell, Key, Check, CheckCheck, Trash2, X, Sparkles, Smartphone, Volume2, VolumeX } from 'lucide-react';
import { AppNotification } from '../types/tournament';
import { Language, pickLocalized } from '../utils/translations';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  lang: Language;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onSelectNotification: (tournamentId: string) => void;
  onSimulateRelease: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  lang,
  onMarkAllAsRead,
  onClearNotifications,
  onSelectNotification,
  onSimulateRelease,
  soundEnabled,
  onToggleSound,
}) => {
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const requestBrowserPush = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-sm sm:max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] mt-14"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">
                {pickLocalized(
                  lang,
                  'Alerts & Notifications',
                  'अलर्ट और नोटिफिकेशन',
                  'অ্যালার্ট ও নোটিফিকেশন'
                )}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                {unreadCount > 0
                  ? `${unreadCount} ${pickLocalized(lang, 'new unread', 'नया अलर्ट', 'টি নতুন অপঠিত')}`
                  : pickLocalized(lang, 'All caught up', 'सभी अलर्ट पढ़े गए', 'সব পড়া হয়েছে')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Browser Push & Test Banner */}
        <div className="p-3 bg-zinc-900 border-b border-zinc-800 space-y-2">
          {browserPermission !== 'granted' && typeof window !== 'undefined' && 'Notification' in window && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2">
              <div className="text-[11px] text-amber-300 leading-tight">
                <Smartphone className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                <span>
                  {pickLocalized(
                    lang,
                    'Enable system push notifications',
                    'मोबाइल / ब्राउज़र पुश अलर्ट ऑन करें',
                    'সিস্টেম পুশ নোটিফিকেশন চালু করুন'
                  )}
                </span>
              </div>
              <button
                onClick={requestBrowserPush}
                className="py-1 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[10px] font-mono whitespace-nowrap"
              >
                Allow
              </button>
            </div>
          )}

          {/* Test simulation button */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-mono">Test Room ID Alert:</span>
            <button
              onClick={onSimulateRelease}
              className="py-1 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-orange-400 border border-orange-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {pickLocalized(lang, 'Trigger Test Alert', 'टेस्ट अलर्ट भेजें', 'টেস্ট অ্যালার্ট পাঠান')}
              </span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs font-mono">
              {pickLocalized(
                lang,
                'No notifications yet',
                'कोई नया नोटिफिकेशन नहीं है',
                'এখনো কোনো নোটিফিকেশন নেই'
              )}
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  onSelectNotification(notif.tournamentId);
                  onClose();
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  !notif.isRead
                    ? 'bg-zinc-900 border-orange-500/40 hover:border-orange-400'
                    : 'bg-zinc-950 border-zinc-800/80 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.type === 'ROOM_RELEASED'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-heading font-bold text-white truncate">
                        {lang === 'hi' ? notif.titleHi : notif.title}
                      </span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5 leading-snug">
                      {lang === 'hi' ? notif.messageHi : notif.message}
                    </p>

                    {(notif.roomId || notif.roomPassword) && (
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-amber-400">
                        {notif.roomId && <span>ID: <strong className="text-white">{notif.roomId}</strong></span>}
                        {notif.roomPassword && <span>Pass: <strong className="text-white">{notif.roomPassword}</strong></span>}
                      </div>
                    )}

                    <div className="text-[9px] text-zinc-500 font-mono mt-1">
                      {notif.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between text-xs font-mono">
            <button
              onClick={onMarkAllAsRead}
              className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mark all read</span>
            </button>

            <button
              onClick={onClearNotifications}
              className="text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
