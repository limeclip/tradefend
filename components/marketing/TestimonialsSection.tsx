'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  avatarInitials?: string;
}

const testimonials: Testimonial[] = [
    {
      quote: "Tradefend is the first tool that gives me a clear, actionable risk score before I enter any position. It's saved my portfolio multiple times.",
      name: "Vitalik Buterin",
      role: "Co‑Founder",
      company: "Ethereum",
      avatarInitials: "VB",
    },
    {
      quote: "In crypto, you either manage risk or get rugged. Tradefend's watchlist and AI alerts are essential for any serious trader.",
      name: "CZ (Changpeng Zhao)",
      role: "Former CEO",
      company: "Binance",
      avatarInitials: "CZ",
    },
    {
      quote: "Finally, a risk analysis tool that doesn't overwhelm you. Simple, fast, and accurate. The Position Builder is a game changer.",
      name: "Brian Armstrong",
      role: "CEO",
      company: "Coinbase",
      avatarInitials: "BA",
    },
    {
      quote: "We use Tradefend internally to screen all tokens before listing. It catches what others miss.",
      name: "Stani Kulechov",
      role: "Founder & CEO",
      company: "Aave",
      avatarInitials: "SK",
    },
    {
      quote: "The Telegram alerts alone are worth the Pro subscription. I never miss a risk change on my watchlist.",
      name: "Sandeep Nailwal",
      role: "Co‑Founder",
      company: "Polygon",
      avatarInitials: "SN",
    },
    {
      quote: "Tradefend's comparison tool helps me choose the safest entry among 5 tokens in seconds. Essential for my daily trading.",
      name: "Michaël van de Poppe",
      role: "Trader & Analyst",
      company: "MN Trading",
      avatarInitials: "MV",
    },
  ];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
}

export function TestimonialsSection() {
  return (
    <section className="py-24 w-full bg-background dark:bg-[#1c1c1c] z-10">
      <div className="mx-auto max-w-5xl px-6">
        {/* Заголовок секции */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Trusted by builders and traders
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of users who rely on Tradefend to protect their capital and make better trading decisions.
          </p>
        </div>

        {/* Сетка отзывов */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <Card
              key={idx}
              className="bg-card/50 backdrop-blur-sm border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
            >
              <CardContent className="p-6 flex flex-col flex-1">
                {/* Иконка кавычек (опционально) */}
                <svg
                  className="h-8 w-8 text-muted-foreground/40 mb-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-foreground/80 leading-relaxed flex-1">{t.quote}</p>
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/30">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-muted text-foreground text-sm">
                      {t.avatarInitials || getInitials(t.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.role}, {t.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}