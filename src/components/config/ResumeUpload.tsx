import { useEffect, useRef, useState } from 'react';
import { Brain, CheckCircle2, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ResumeUploadProps {
  resumePath: string;
  onResumeChange: (v: string) => void;
  fileSuggestions: string[];
  onFileInput: (v: string) => void;
  analyzing: boolean;
  analysisMsg: string | null;
  onAnalyze: () => void;
  /** Hide the Analyze button (e.g. in the onboarding wizard). */
  showAnalyze?: boolean;
}

/**
 * Resume picker: drag-and-drop or browse to upload a PDF to the backend
 * (~/.nexus/resumes), plus a text path input with filesystem autocomplete
 * for users who prefer to type a path.
 */
export function ResumeUpload({
  resumePath,
  onResumeChange,
  fileSuggestions,
  onFileInput,
  analyzing,
  analysisMsg,
  onAnalyze,
  showAnalyze = true,
}: ResumeUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showFileAC, setShowFileAC] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<HTMLDivElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      setUploadError('Only PDF files are supported.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const result = await api.uploadResume(file);
      onResumeChange(result.path);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (acRef.current && !acRef.current.contains(e.target as Node)) {
        setShowFileAC(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
        Resume
      </label>
      {resumePath ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3.5 py-2.5">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span className="flex-1 truncate text-sm text-slate-200">
            {resumePath}
          </span>
          <button
            type="button"
            onClick={() => {
              onResumeChange('');
              onFileInput('');
            }}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void handleFile(e.dataTransfer.files[0] ?? undefined);
          }}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors',
            dragOver
              ? 'border-neon-cyan bg-neon-cyan/5'
              : 'border-white/10 bg-ink-950/40 hover:border-neon-cyan/40',
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? undefined)}
          />
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-neon-cyan" />
          ) : (
            <Upload className="h-6 w-6 text-slate-500" />
          )}
          <p className="text-sm text-slate-400">
            {uploading
              ? 'Uploading…'
              : 'Drop your PDF resume here, or click to browse'}
          </p>
        </div>
      )}
      {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
      {/* Text path input with file autocomplete */}
      <div className="relative" ref={acRef}>
        <input
          type="text"
          value={resumePath}
          onChange={(e) => {
            onResumeChange(e.target.value);
            onFileInput(e.target.value);
            setShowFileAC(true);
          }}
          onFocus={() => setShowFileAC(true)}
          placeholder="/Users/you/.nexus/resumes/improved-...pdf"
          className="mt-2 w-full rounded-xl border border-white/5 bg-ink-950/60 px-3.5 py-2 text-xs text-slate-300 placeholder:text-slate-600 transition-colors focus:border-neon-cyan/40 focus:outline-none"
        />
        {showFileAC && fileSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border border-white/5 bg-ink-800 py-1 shadow-panel">
            {fileSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onResumeChange(s);
                  setShowFileAC(false);
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-slate-100"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Analyze button + status */}
      {showAnalyze && (
        <div className="flex items-center gap-3 pt-1">
          <Button
            size="sm"
            variant="outline"
            leftIcon={
              analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />
            }
            loading={analyzing}
            disabled={!resumePath.trim()}
            onClick={onAnalyze}
          >
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
          {analysisMsg && (
            <span
              className={cn(
                'text-xs',
                analysisMsg.includes('valid') || analysisMsg.includes('ready')
                  ? 'text-emerald-400'
                  : 'text-red-400',
              )}
            >
              {analysisMsg}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
