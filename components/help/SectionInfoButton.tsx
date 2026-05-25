'use client';

import * as React from 'react';
import { Info } from 'lucide-react';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { HELP_SECTIONS, type HelpSectionId } from '@/lib/help/section-copy';

type Props = {
  section: HelpSectionId;
  className?: string;
};

export function SectionInfoButton({ section, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const content = HELP_SECTIONS[section];

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={className ?? 'size-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground'}
        aria-label={`About ${content.title}`}
        onClick={() => setOpen(true)}
      >
        <Info className="size-4" strokeWidth={1.75} />
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={content.title} className="max-w-md">
        <div className="space-y-5 p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">{content.subtitle}</p>
          <ul className="space-y-3">
            {content.bullets.map((bullet, idx) => (
              <li key={idx} className="flex gap-3 text-sm leading-relaxed text-foreground/90">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          <Button type="button" className="h-10 w-full rounded-xl" onClick={() => setOpen(false)}>
            Got it
          </Button>
        </div>
      </Modal>
    </>
  );
}
