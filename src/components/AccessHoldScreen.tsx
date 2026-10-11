import React from 'react';
import { Clock, ShieldAlert, XCircle, LogOut, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { EmailLogItem, UserProfile, UserPrivateInfo } from '../types';
import { ROLE_LABELS } from '../constants';

interface AccessHoldScreenProps {
  profile: UserProfile;
  privateInfo: UserPrivateInfo | null;
  emailLogs: EmailLogItem[];
  onSignOut: () => Promise<void>;
  onRefreshStatus: () => Promise<void>;
  onPromoteDemoRole?: (role: 'supreme_kunda5' | 'admin' | 'approved_member') => Promise<void>;
}

export const AccessHoldScreen: React.FC<AccessHoldScreenProps> = ({
  profile,
  privateInfo,
  emailLogs,
  onSignOut,
  onRefreshStatus,
}) => {
  const isPending = profile.status === 'pending';
  const isExpired = profile.status === 'expired';
  const isRejected = profile.status === 'rejected';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-4 bg-white border-b border-slate-200">
        <span className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0">
          Apex Study Hub
        </span>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span>Account Identity: {profile.name}</span>
          <span>·</span>
          <span>Role: {ROLE_LABELS[profile.role]}</span>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          <div className="flex items-start gap-4">
            {isPending && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                <Clock className="w-6 h-6" />
              </div>
            )}
            {isExpired && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                <ShieldAlert className="w-6 h-6" />
              </div>
            )}
            {isRejected && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                <XCircle className="w-6 h-6" />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-500">
                <span>IAM ACCESS GATE</span>
                <span>·</span>
                <span
                  className={
                    isPending
                      ? 'text-amber-700 font-semibold'
                      : 'text-rose-700 font-semibold'
                  }
                >
                  STATUS: {profile.status.toUpperCase()}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900">
                {isPending && 'Awaiting Manual Administrator Confirmation'}
                {isExpired && 'Your 1-Month Study Hub Membership Has Expired'}
                {isRejected && 'Membership Application Declined'}
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed">
                {isPending &&
                  'New signups are locked out by default per platform security policy. Supreme Admin ("Obster" or "Kunda5") must manually review and approve your registration before course materials, PDF notes, and tutorial videos unlock.'}
                {isExpired &&
                  'Ordinary member access automatically expires 1 month after approval. Your account is temporarily blocked from accessing study resources until an administrator manually renews your membership.'}
                {isRejected &&
                  'An administrator has reviewed and declined this membership request. Please review your automated email notification log below or contact faculty administration.'}
              </p>
            </div>
          </div>

          {/* Registered Profile Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Full Name</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{profile.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Registered Email</span>
              <span className="font-mono text-slate-900 mt-0.5 block truncate">
                {privateInfo?.email || 'Verified via Auth'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Registered Phone</span>
              <span className="font-mono tabular-nums text-slate-900 mt-0.5 block">
                {privateInfo?.phone || 'On File'}
              </span>
            </div>
          </div>

          {isExpired && profile.expiresAt && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-mono tabular-nums">
              Membership Expired On: {new Date(profile.expiresAt).toLocaleString()}
            </div>
          )}

          {/* Automated Email Notification Inbox */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Mail className="w-4 h-4 text-sky-600" />
                <span>Automated Email Notification Log ({emailLogs.length})</span>
              </div>
              <button
                type="button"
                onClick={onRefreshStatus}
                className="px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-50 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check Approval Status</span>
              </button>
            </div>

            {emailLogs.length === 0 ? (
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500">
                No automated email dispatches received yet. As soon as an administrator approves or
                updates your account, an automated email notification will be dispatched and logged
                here.
              </div>
            ) : (
              <div className="space-y-2">
                {emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-500 font-mono">
                      <span>To: {log.recipientEmail}</span>
                      <span>Event: {log.eventType}</span>
                    </div>
                    <p className="font-semibold text-slate-900">{log.subject}</p>
                    <p className="text-slate-600 leading-relaxed">{log.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              Session persisted in Firestore Database
            </span>
            <span>Supreme Admin: Obster (zuluobster@gmail.com)</span>
          </div>
        </div>
      </main>
    </div>
  );
};
