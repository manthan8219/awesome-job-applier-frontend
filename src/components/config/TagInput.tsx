import { type KeyboardEvent, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  /** Accessible name for the inner text input */
  ariaLabel?: string;
  /** When provided, pressing Enter shows the input value as a suggestion chip */
  addOnEnter?: boolean;
  /** When non-empty, shown as a dropdown below the input */
  suggestions?: string[];
  onInputChange?: (value: string) => void;
}

export function TagInput({
  tags,
  onTagsChange,
  placeholder = 'Type and press Enter…',
  className,
  ariaLabel,
  suggestions = [],
  onInputChange,
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
    }
    setInput('');
  }

  function removeTag(index: number) {
    onTagsChange(tags.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  function handleInputChange(value: string) {
    setInput(value);
    onInputChange?.(value);
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div
        className={cn(
          'flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl border border-white/5 bg-ink-950/60 px-3 py-1.5 transition-colors',
          focused && 'border-neon-cyan/40',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-lg border border-neon-violet/20 bg-neon-violet/10 px-2 py-0.5 text-xs font-medium text-neon-violet"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
              className="ml-0.5 rounded-sm text-neon-violet/60 hover:text-neon-violet focus:outline-none"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          aria-label={ariaLabel}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
        />
      </div>

      {focused && suggestions.length > 0 && (
        <div className="z-10 rounded-xl border border-white/5 bg-ink-800 py-1 shadow-panel">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(s)}
              className="w-full px-3 py-1.5 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-slate-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}