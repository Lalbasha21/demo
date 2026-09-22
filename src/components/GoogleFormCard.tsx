/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Send,
  RotateCcw
} from 'lucide-react';
import { GoogleForm, PlacementDrive } from '../types';

interface GoogleFormCardProps {
  drive: PlacementDrive;
  form?: GoogleForm;
  onSync: () => Promise<void>;
  onRetryCreate: () => Promise<void>;
  onOpenTestSubmit: () => void;
  syncing: boolean;
  syncResultMsg?: string | null;
}

export const GoogleFormCard: React.FC<GoogleFormCardProps> = ({
  drive,
  form,
  onSync,
  onRetryCreate,
  onOpenTestSubmit,
  syncing,
  syncResultMsg,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!form?.form_url) return;
    navigator.clipboard.writeText(form.form_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not yet synced';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  if (!form) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded p-4 text-rose-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <div>
            <p className="text-sm font-semibold">Placement drive created, but Google Form creation failed.</p>
            <p className="text-xs text-rose-600">No Google Form is currently linked to {drive.company_name} drive.</p>
          </div>
        </div>
        <button
          id="btn-retry-google-form-create"
          onClick={onRetryCreate}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-medium hover:bg-rose-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry Google Form Creation</span>
        </button>
      </div>
    );
  }

  const isSyncFailed = form.status === 'SYNC_FAILED';

  return (
    <div className="bg-white border border-slate-200 rounded shadow-xs p-5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Side: Status and Identity */}
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Google Form Registration
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono ${
                  isSyncFailed
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {isSyncFailed ? (
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                      Google Form Sync Failed
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                      CONNECTED
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Form Title: <span className="font-medium text-slate-700">{form.form_title}</span> (Drive: {drive.id})
              </p>
            </div>
          </div>

          {/* Form URL display */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Form URL:</span>
            <code className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 text-xs font-mono select-all">
              {form.form_url}
            </code>
            <button
              id="btn-copy-form-url"
              onClick={handleCopyLink}
              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100"
              title="Copy Google Form Link to share with students"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>Copy Form Link</span>
                </>
              )}
            </button>
            <button
              id="btn-open-form-url"
              onClick={onOpenTestSubmit}
              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
              title="Open preview or submit form response"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open Form / Test Submit</span>
            </button>
          </div>
        </div>

        {/* Right Side: Metrics & Sync action */}
        <div className="flex flex-wrap items-center gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <div className="text-left lg:text-right">
            <p className="text-xs text-slate-500">Response Count</p>
            <p className="text-xl font-bold text-slate-900 font-mono">
              {form.response_count ?? 0}
            </p>
            <p className="text-xs text-slate-400">
              Last Synced: <span className="text-slate-600 font-medium">{formatDate(form.last_synced_at)}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              id="btn-sync-google-form"
              onClick={onSync}
              disabled={syncing}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Synchronizing...' : 'Sync Responses'}</span>
            </button>

            <button
              id="btn-simulate-submit"
              onClick={onOpenTestSubmit}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-medium hover:bg-slate-200 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-slate-500" />
              <span>Submit Response</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Failure or Success Banner */}
      {isSyncFailed && form.error_message && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Google Form Sync Failed: {form.error_message}</span>
          </div>
          <button
            onClick={onSync}
            className="px-2 py-1 bg-rose-600 text-white rounded font-medium hover:bg-rose-700"
          >
            Retry Sync
          </button>
        </div>
      )}

      {syncResultMsg && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>{syncResultMsg}</span>
        </div>
      )}
    </div>
  );
};
