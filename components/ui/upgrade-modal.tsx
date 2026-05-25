'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description: string;
  ctaLabel?: string;
};

export function UpgradeModal({
  isOpen,
  onClose,
  title = 'Upgrade to Pro',
  description,
  ctaLabel = 'Upgrade now',
}: UpgradeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-lg">
      <div className="space-y-6">
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
            Maybe later
          </Button>
          <Link href="/pricing" onClick={onClose}>
            <Button type="button" className="rounded-xl">
              {ctaLabel}
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
