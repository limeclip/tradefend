import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';

export const metadata = {
    title: 'Privacy Policy | Tradefend',
    description: 'Privacy Policy for Tradefend – how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
    return (
        <div className='min-h-screen bg-sidebar'>
            <Header />
            <div className="mx-auto max-w-4xl px-6 py-12 md:py-12">
                <div className="space-y-4">
                    <Badge variant="outline" className="rounded-full px-4 py-1 text-sm font-medium">
                        Legal
                    </Badge>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>
                    <p className="text-muted-foreground">Last updated: May 21, 2026</p>
                </div>

                <div className="prose prose-gray dark:prose-invert mt-8 max-w-none space-y-6">
                    <h2>1. Information We Collect</h2>
                    <p>
                        <strong>Account Information:</strong> When you register, we collect your email address, name (optional),
                        and authentication data via Supabase Auth. We do not store your password directly.
                    </p>
                    <p>
                        <strong>Usage Data:</strong> We collect token addresses you search, risk reports generated, watchlist items,
                        comparison history, position plans, open positions, and activity timestamps. This data is used to provide
                        the Service and improve it.
                    </p>
                    <p>
                        <strong>Telegram ID:</strong> If you choose to enable Telegram notifications, we store your Telegram chat ID.
                    </p>
                    <p>
                        <strong>Payment Information:</strong> Payments are processed by PayPro. We do not store your credit card
                        details or full payment credentials; we only store subscription status and billing identifiers.
                    </p>
                    <p>
                        <strong>Third‑Party API Data:</strong> When you analyze a token, we send its address to Moralis, GoPlus,
                        Etherscan, DexScreener, etc. Those services may log your request. We recommend reviewing their privacy policies.
                    </p>

                    <h2>2. How We Use Your Information</h2>
                    <ul>
                        <li>Provide, maintain, and improve Tradefend features.</li>
                        <li>Send you notifications about risk changes (in‑app and via Telegram if you opt in).</li>
                        <li>Manage your subscription and billing.</li>
                        <li>Analyze usage trends to enhance performance and security.</li>
                        <li>Comply with legal obligations.</li>
                    </ul>

                    <h2>3. Data Sharing & Disclosure</h2>
                    <p>
                        We do not sell your personal data. We may share data with:
                    </p>
                    <ul>
                        <li><strong>Service providers:</strong> Supabase (database & auth), Vercel (hosting), PayPro (payments), Telegram (if you enable notifications).</li>
                        <li><strong>Blockchain APIs:</strong> Moralis, GoPlus, Etherscan, DexScreener – to fetch token data.</li>
                        <li><strong>Legal requirements:</strong> If required by law or to protect our rights.</li>
                    </ul>

                    <h2>4. Data Retention</h2>
                    <p>
                        We retain your account information and activity data as long as your account is active. If you delete your
                        account, we will remove most personal data within 30 days, except where retention is required for legal
                        or legitimate business purposes (e.g., tax records for paid subscriptions).
                    </p>

                    <h2>5. Your Rights</h2>
                    <p>
                        Depending on your jurisdiction, you may have the right to access, correct, delete, or export your personal
                        data. You can do most of this directly via your account settings. For additional requests, contact us at
                        tradefend@gmail.com.
                    </p>

                    <h2>6. Security</h2>
                    <p>
                        We use industry‑standard measures to protect your data (encryption in transit and at rest). However,
                        no method of transmission over the Internet is 100% secure. You use the Service at your own risk.
                    </p>

                    <h2>7. Children’s Privacy</h2>
                    <p>
                        The Service is not intended for individuals under 18. We do not knowingly collect personal information from
                        minors. If you become aware that a child has provided us with personal data, please contact us.
                    </p>

                    <h2>8. International Transfers</h2>
                    <p>
                        Your information may be transferred to and processed in countries where our service providers operate
                        (e.g., US, EU). We ensure appropriate safeguards are in place.
                    </p>

                    <h2>9. Changes to This Privacy Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. We will notify you of material changes via email or
                        a notice on the Service. Your continued use after the effective date constitutes acceptance.
                    </p>

                    <h2>10. Contact Information</h2>
                    <p>
                        For privacy-related questions or to exercise your rights, contact us at{' '}
                        <a href="mailto:tradefend@gmail.com" className="underline underline-offset-2">tradefend@gmail.com</a>.
                    </p>
                </div>

                <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
                    Tradefend is committed to protecting your privacy and data.
                </div>
            </div>
            <Footer />
        </div>
    );
}