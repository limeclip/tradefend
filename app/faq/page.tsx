
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

export const metadata = {
    title: 'FAQ | Tradefend',
    description: 'Frequently asked questions about Tradefend – risk checker, watchlist, AI position builder, pricing, and more.',
};

const faqs = [
    {
        question: 'What is Tradefend?',
        answer:
            'Tradefend is an AI-powered crypto risk management platform. It helps you analyze tokens, track them in a smart watchlist, compare multiple tokens, build safe positions with AI recommendations, monitor open positions, and share public risk reports.',
    },
    {
        question: 'How does the Risk Checker work?',
        answer:
            'Enter a token address or ticker (BTC, ETH, etc.). Tradefend analyzes liquidity, holder concentration, volatility, contract security, and more. You get an overall risk score (LOW/MEDIUM/HIGH/CRITICAL) plus an AI insight and quick decision recommendation.',
    },
    {
        question: 'What is the Smart Watchlist?',
        answer:
            'You can add tokens to your watchlist. Tradefend automatically updates their risk scores based on your plan (Free: every 6 hours, Pro: every 2 hours). You receive in-app and Telegram alerts when risk changes significantly.',
    },
    {
        question: 'What is the Safe Position Builder?',
        answer:
            'After analyzing a token, you can build a position. AI recommends position size (% of deposit), stop-loss, and take-profit based on the token’s risk level. You can save the plan or open a real position.',
    },
    {
        question: 'What is Position Guardian?',
        answer:
            'Once you open a position, Guardian monitors it. You get alerts when risk increases or price approaches your stop-loss/take-profit. Close positions manually at any time.',
    },
    {
        question: 'What are Shareable Risk Pages?',
        answer:
            'Every token analysis has a public, SEO-friendly page (`/token/...`). You can share the link on X (Twitter), Telegram, or copy it. Great for building trust and attracting organic traffic.',
    },
    {
        question: 'What is the Proven Safe List?',
        answer:
            'A curated daily list of low-risk tokens with high liquidity and good holder distribution. Available for Pro subscribers. You’ll find it on your dashboard and a dedicated `/safe-list` page.',
    },
    {
        question: 'Is there a free plan?',
        answer:
            'Yes. Free plan includes 5 checks per month, up to 8 watchlist tokens (updated every 6 hours), 3 position plans per day, and 2 active positions at a time. Pro plans unlock higher limits and exclusive features like the Proven Safe List and unlimited weekly insights.',
    },
    {
        question: 'How do I connect Telegram notifications?',
        answer:
            'Go to Settings, enter your Telegram chat ID (you can get it from @userinfobot), and save. You’ll receive risk change alerts directly in Telegram.',
    },
    {
        question: 'Which blockchains are supported?',
        answer:
            'Currently, Ethereum and BSC are fully supported. Solana is partially supported (basic analysis). More chains will be added based on user demand.',
    },
    {
        question: 'Is my data safe?',
        answer:
            'Yes. We use Supabase Auth, encrypted storage, and never share your personal data. Your API keys are stored securely as environment variables.',
    },
    {
        question: 'How often are watchlist tokens refreshed?',
        answer:
            'Free plan: every 6 hours. Pro plan: every 2 hours. You can also manually refresh any token with the “Check now” button (credits apply).',
    },
    {
        question: 'What happens if I exceed my plan limits?',
        answer:
            'You’ll see an error message and need to upgrade to Pro or wait for the next month’s reset (for Free plan monthly checks).',
    },
    {
        question: 'Can I cancel my Pro subscription?',
        answer:
            'Yes. You can cancel anytime from your account settings or via the payment provider (PayPro). Your subscription will remain active until the end of the billing period.',
    },
    {
        question: 'How do I get support?',
        answer:
            'Contact us at tradefend@gmail.com. We’ll get back to you within 24–48 hours.',
    },
];

export default function FAQPage() {
    return (
        <div className='min-h-screen bg-sidebar'>
            <Header />
            <div className="mx-auto max-w-3xl px-6 py-12 md:py-12">
                <div className="text-center space-y-4">
                    <Badge variant="outline" className="rounded-full px-4 py-1 text-sm font-medium">
                        FAQ
                    </Badge>
                    <h1 className="text-4xl font-semibold tracking-tight sm:text-4xl">
                        Frequently asked questions
                    </h1>
                    <p className="mx-auto max-w-2xl text-muted-foreground">
                        Everything you need to know about Tradefend. Can’t find the answer?{' '}
                        <a href="mailto:tradefend@gmail.com" className="underline underline-offset-2 hover:text-foreground">
                            Contact us
                        </a>
                        .
                    </p>
                </div>

                <div className="mt-12 border-t border-border" />

                <Accordion className="mt-8 w-full max-w-3xl mx-auto">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} >
                            <AccordionTrigger className="text-left text-base  hover:no-underline cursor-pointer">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                <div className="mt-16 rounded-2xl border border-border bg-muted/30 p-6 text-center">
                    <h2 className="text-xl font-semibold">Still have questions?</h2>
                    <p className="mt-2 text-muted-foreground">
                        We’re here to help. Reach out and we’ll get back to you as soon as possible.
                    </p>
                    <a
                        href="mailto:tradefend@gmail.com"
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
                    >
                        Contact Support
                    </a>
                </div>
            </div>
            <Footer/>
        </div>
    );
}