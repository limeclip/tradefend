import Link from 'next/link';
import React from 'react';

export default function Footer() {
    return (
        <div className="flex flex-col w-full gap-4 items-center mx-auto py-6">
            <div>
                <ul className="list-none flex items-center gap-4">
                    <Link href="/about" className="cursor-pointer">
                        <li className="text-sm text-muted-foreground hover:text-foreground">About</li>
                    </Link>
                    <li className="text-sm text-muted-foreground">•</li>
                    <Link href="/terms" className="cursor-pointer">
                        <li className="text-sm text-muted-foreground hover:text-foreground">Terms</li>
                    </Link>
                    <li className="text-sm text-muted-foreground">•</li>
                    <Link href="/privacy" className="cursor-pointer">
                        <li className="text-sm text-muted-foreground hover:text-foreground">Privacy</li>
                    </Link>
                    <li className="text-sm text-muted-foreground">•</li>
                    <Link href="mailto:tradefend@gmail.com" className="cursor-pointer">
                        <li className="text-sm text-muted-foreground hover:text-foreground">Contact</li>
                    </Link>
                </ul>
            </div>
            <div className="text-sm text-foreground/80">
            © 2026  Made with ❤️ by Tradefend Team
            </div>
        </div>
    );
}