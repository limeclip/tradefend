import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';

export const metadata = {
    title: 'Terms of Service | Tradefend',
    description: 'Terms of Service for Tradefend – AI-powered crypto risk management platform.',
};

export default function TermsPage() {
    return (
        <div className='min-h-screen bg-sidebar'>
            <Header />
            <div className="mx-auto max-w-4xl px-6 py-12 md:py-12">
                <div className="space-y-4">
                    <Badge variant="outline" className="rounded-full px-4 py-1 text-sm font-medium">
                        Legal
                    </Badge>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Terms of Service</h1>
                    <p className="text-muted-foreground">Last updated: May 21, 2026</p>
                </div>

                <div className="prose prose-gray dark:prose-invert mt-8 max-w-none space-y-6">
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using Tradefend (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;).
                        If you do not agree, please do not use the Service.
                    </p>

                    <h2>2. Description of Service</h2>
                    <p>
                        Tradefend provides crypto risk analysis tools, including token risk scoring, watchlists, comparison tools,
                        AI‑powered position builder, position guardian, shareable public risk pages, and curated safe lists.
                        The Service interacts with third‑party APIs (Moralis, GoPlus, Etherscan, DexScreener, etc.) and may
                        store token addresses, risk scores, user preferences, and basic account information.
                    </p>

                    <h2>3. Eligibility</h2>
                    <p>
                        You must be at least 18 years old and capable of forming a binding contract. By using the Service,
                        you represent that you meet these requirements.
                    </p>

                    <h2>4. Account Registration & Security</h2>
                    <p>
                        You may need to register an account using Supabase Auth. You are responsible for maintaining the
                        confidentiality of your login credentials and for all activities that occur under your account.
                        Notify us immediately of any unauthorized use.
                    </p>

                    <h2>5. Subscriptions & Payments</h2>
                    <p>
                        Tradefend offers a Free plan and paid Pro plans (monthly/yearly). Paid subscriptions are processed
                        through our payment provider (PayPro). By purchasing a subscription, you agree to pay the applicable
                        fees. Subscriptions auto-renew unless cancelled before the renewal date. Refunds are handled on a
                        case‑by‑case basis and are not guaranteed.
                    </p>

                    <h2>6. Fair Use & Rate Limits</h2>
                    <p>
                        Free accounts have limited checks per month, watchlist size, update frequency, and position plans.
                        Pro accounts have higher limits. Abuse of the Service (excessive automated requests, scraping,
                        reverse engineering) may result in suspension or termination.
                    </p>

                    <h2>7. Third‑Party Services & Data</h2>
                    <p>
                        Tradefend relies on external blockchain data providers (Moralis, GoPlus, Etherscan, DexScreener, etc.).
                        We do not guarantee the accuracy, timeliness, or completeness of data from these sources.
                        You use the Service at your own risk.
                    </p>

                    <h2>8. No Financial Advice</h2>
                    <p>
                        All risk scores, AI insights, position recommendations, and other content are for informational purposes
                        only. They do not constitute financial, investment, or trading advice. You are solely responsible
                        for your trading decisions. Past performance does not guarantee future results.
                    </p>

                    <h2>9. Intellectual Property</h2>
                    <p>
                        The Service (code, design, logos, trademarks) is owned by Tradefend. You may not copy, modify,
                        distribute, or create derivative works without our written permission.
                    </p>

                    <h2>10. Termination</h2>
                    <p>
                        We may suspend or terminate your account at any time for violation of these Terms or for any other
                        reason at our sole discretion. Upon termination, your right to use the Service ceases immediately.
                        You may delete your account at any time via Settings.
                    </p>

                    <h2>11. Limitation of Liability</h2>
                    <p>
                        To the maximum extent permitted by law, Tradefend shall not be liable for any indirect, incidental,
                        special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred
                        directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting
                        from your use of the Service.
                    </p>

                    <h2>12. Disclaimer of Warranties</h2>
                    <p>
                        The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express
                        or implied, including but not limited to implied warranties of merchantability, fitness for a
                        particular purpose, or non‑infringement.
                    </p>

                    <h2>13. Governing Law</h2>
                    <p>
                        These Terms shall be governed by and construed in accordance with the laws of [Your Country/State],
                        without regard to its conflict of law provisions.
                    </p>

                    <h2>14. Changes to Terms</h2>
                    <p>
                        We may update these Terms from time to time. We will notify you of material changes via email or
                        through the Service. Your continued use after the effective date constitutes acceptance of the
                        revised Terms.
                    </p>

                    <h2>15. Contact Us</h2>
                    <p>
                        If you have any questions about these Terms, please contact us at{' '}
                        <a href="mailto:tradefend@gmail.com" className="underline underline-offset-2">tradefend@gmail.com</a>.
                    </p>
                </div>

                <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
                    By using Tradefend, you acknowledge that you have read, understood, and agree to these Terms of Service.
                </div>
            </div>
            <Footer />
        </div>
    );
}