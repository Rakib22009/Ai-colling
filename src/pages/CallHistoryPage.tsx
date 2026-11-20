import React, { useMemo, useState } from 'react';
import { Phone, Search, ShieldCheck, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { useI18n } from '../context/I18nContext';
import { CallRecord, LANGUAGE_LABELS } from '../types';

interface Props {
  onNavigate: (path: string) => void;
}

function formatDate(val: unknown): string {
  if (!val) return '—';
  if (
    typeof val === 'object' &&
    val !== null &&
    'toDate' in val &&
    typeof (val as { toDate: () => Date }).toDate === 'function'
  ) {
    return (val as { toDate: () => Date }).toDate().toLocaleString();
  }
  return String(val);
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const CallHistoryPage: React.FC<Props> = ({ onNavigate }) => {
  const { privateUser, callHistory } = useAuth();
  const { startCall } = useCall();
  const { t } = useI18n();
  const [filter, setFilter] = useState<'all' | 'voice' | 'video' | 'missed'>('all');
  const [search, setSearch] = useState('');

  const filteredCalls = useMemo(() => {
    return callHistory.filter((c: CallRecord) => {
      if (filter === 'voice' && c.type !== 'voice') return false;
      if (filter === 'video' && c.type !== 'video') return false;
      if (filter === 'missed' && c.status !== 'missed' && c.status !== 'rejected') return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return c.callerName.toLowerCase().includes(q) || c.calleeName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [callHistory, filter, search]);

  if (!privateUser) return null;

  const filterLabels: Record<'all' | 'voice' | 'video' | 'missed', string> = {
    all: t.history.filterAll,
    voice: t.history.filterVoice,
    video: t.history.filterVideo,
    missed: t.history.filterMissed,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl">{t.history.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.history.subtitle}</p>
        </div>

        <div className="inline-flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{t.history.zeroRecording}</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl w-fit">
          {(['all', 'voice', 'video', 'missed'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filter === key
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {filterLabels[key]}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.history.searchPlaceholder}
            className="w-full min-h-[40px] pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Call Records List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {filteredCalls.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.history.noMatches}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.history.noMatchesDesc}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCalls.map((call) => {
              const isCaller = call.callerUid === privateUser.uid;
              const peerUid = isCaller ? call.calleeUid : call.callerUid;
              const peerName = isCaller ? call.calleeName : call.callerName;
              const peerPhoto = isCaller ? call.calleePhoto : call.callerPhoto;
              const peerLang = isCaller ? call.calleeLang : call.callerLang;

              return (
                <div
                  key={call.id}
                  className="p-4 sm:px-6 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                >
                  <button
                    type="button"
                    onClick={() => onNavigate(`/profile/${peerUid}`)}
                    className="flex items-center gap-3.5 min-w-0 text-left"
                  >
                    {peerPhoto ? (
                      <img
                        src={peerPhoto}
                        alt={peerName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-semibold text-sm shrink-0">
                        {peerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{peerName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isCaller ? t.history.outgoing : t.history.incoming} ·{' '}
                        {call.type === 'video' ? t.common.video : t.common.voice} ·{' '}
                        <span
                          className={
                            call.status === 'missed' || call.status === 'rejected'
                              ? 'text-red-600 dark:text-red-400'
                              : ''
                          }
                        >
                          {call.status}
                        </span>{' '}
                        · {LANGUAGE_LABELS[call.callerLang].codeLabel} ↔ {LANGUAGE_LABELS[call.calleeLang].codeLabel}
                      </p>
                      {call.summaryText && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 line-clamp-2">
                          {t.history.summaryPrefix} {call.summaryText}
                        </p>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-4 ml-auto shrink-0">
                    <div className="text-right">
                      <p className="font-mono text-xs font-medium tabular-nums">
                        {formatDuration(call.durationSeconds || 0)}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDate(call.startedAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          void startCall(
                            {
                              uid: peerUid,
                              displayName: peerName,
                              photoURL: peerPhoto,
                              preferredLanguage: peerLang,
                            },
                            'voice'
                          )
                        }
                        title={t.common.voice}
                        className="min-h-[38px] min-w-[38px] rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void startCall(
                            {
                              uid: peerUid,
                              displayName: peerName,
                              photoURL: peerPhoto,
                              preferredLanguage: peerLang,
                            },
                            'video'
                          )
                        }
                        title={t.common.video}
                        className="min-h-[38px] min-w-[38px] rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
