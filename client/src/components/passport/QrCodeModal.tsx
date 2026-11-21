import React from 'react';
import { X, ExternalLink, Copy, Check } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  passportId: string;
  workerName: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  passportId,
  workerName
}) => {
  const [copied, setCopied] = React.useState(false);
  if (!isOpen) return null;

  const publicUrl = `${window.location.origin}/passport/${passportId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-brand-border p-6 z-10 animate-in fade-in zoom-in-95 text-center">
        <div className="flex justify-end">
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-brand-dark rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-brand-primary-light mx-auto flex items-center justify-center text-brand-primary font-bold text-lg mb-2">
          K
        </div>

        <h3 className="text-base font-extrabold text-brand-dark">Skill Passport QR Code</h3>
        <p className="text-xs text-brand-muted mt-0.5">{workerName}'s Verified Digital Identity</p>

        {/* QR Code Container */}
        <div className="my-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block shadow-inner">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}&color=14-92-72`}
            alt="Skill Passport QR Code"
            className="w-44 h-44 mx-auto rounded-lg"
          />
        </div>

        <div className="text-[11px] font-mono text-brand-muted break-all bg-slate-100 p-2 rounded-xl mb-4 text-left flex items-center justify-between">
          <span className="truncate pr-2">{publicUrl}</span>
          <button
            onClick={handleCopy}
            className="p-1 text-brand-primary hover:bg-white rounded transition-colors flex-shrink-0"
            title="Copy URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex gap-2">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-dark transition-all flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Public Profile</span>
          </a>
        </div>
      </div>
    </div>
  );
};
