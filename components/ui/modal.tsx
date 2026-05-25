'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
};

export function Modal({ isOpen, onClose, children, className, title }: ModalProps) {
  const backdropRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/45 backdrop-blur-[2px] dark:bg-black/60',
        'animate-in fade-in duration-200',
      )}
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Modal'}
    >
      <div
        className={cn(
          'relative w-[92vw] max-w-6xl rounded-2xl border border-border bg-background dark:bg-[#1c1c1c] shadow-2xl',
          'animate-in zoom-in-95 slide-in-from-bottom-2 duration-200',
          'max-md:h-screen max-md:w-screen max-md:max-w-none max-md:rounded-none max-md:border-0 ',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
          <div className="min-w-0">
            {title ? <p className="truncate text-sm font-medium text-foreground">{title}</p> : null}
          </div>
          <Button variant="ghost" className="rounded-xl cursor-pointer" onClick={onClose}>
            <span className="hidden md:inline">
            <X />
            </span>
            <span className="md:hidden">Back</span>
          </Button>
        </div>

        <div className="max-md:h-[calc(100vh-52px)] max-md:overflow-auto max-h-[90vh] overflow-y-auto">
          <div className="">{children}</div>
        </div>
      </div>
    </div>
  );
}
