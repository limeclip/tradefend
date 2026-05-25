'use client';

import { useRef } from 'react';
import { motion, MotionValue, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

interface CardData {
  number: string;
  title: string;
  description: string;
  image: React.ReactNode;
  buttonText: string;
  buttonLink: string;
}

const cards: CardData[] = [
  {
    number: '01 / 05',
    title: 'Pre-Trade Risk Checker',
    description: 'Enter any token address and instantly receive a clear risk score, liquidity check, holder concentration, volatility, and contract security analysis. AI explains why the token is risky or safe — no more guessing or relying on gut feeling. Stop losing money on tokens you never fully understood.',
    image: (
      <div className="relative w-full h-full min-h-[320px] rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 from-10% via-purple-500 via-30% to-pink-500 to-90%" />
        <div className="relative z-10 w-full h-full ml-8 mt-8 ">
          <Image
            src="/screenshots/analize-d2.png"
            alt="Risk Checker (dark)"
            fill
            className="object-cover object-left-top hidden dark:block rounded-tl-xl"
          />
          <Image
            src="/screenshots/analize-l.png"
            alt="Risk Checker (light)"
            fill
            className="object-cover object-left-top block dark:hidden rounded-tl-xl"
          />
        </div>
      </div>
    ),
    buttonText: 'Try Risk Checker',
    buttonLink: '/dashboard',
  },
  {
    number: '02 / 05',
    title: 'Smart Watchlist & Alerts',
    description: 'Save tokens you are watching. Tradefend automatically updates their risk scores based on your plan and sends you alerts (in-app and Telegram) when risk changes significantly. Never be surprised by a sudden liquidity drop or a rug pull again. Your portfolio deserves constant vigilance, even when you sleep.',
    image: (
      <div className="relative w-full h-full min-h-[320px] rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500 from-10% via-emerald-500 via-30% to-indigo-500 to-90%"/>
        <div className="relative z-10 w-full h-full ml-8 mt-8 ">
          <Image
            src="/screenshots/whatlist-d.png"
            alt="Risk Checker (dark)"
            fill
            className="object-cover object-left-top hidden dark:block rounded-tl-xl"
          />
          <Image
            src="/screenshots/whatlist-l.png"
            alt="Risk Checker (light)"
            fill
            className="object-cover object-left-top block dark:hidden rounded-tl-xl"
          />
        </div>
      </div>
    ),
    buttonText: 'View Watchlist',
    buttonLink: '/watchlist',
  },
  {
    number: '03 / 05',
    title: 'AI Position Builder',
    description: 'Transform a risk analysis into a concrete trade plan. AI recommends the optimal position size (% of your deposit), stop‑loss level, and take‑profit target based on the token’s real risk. Save your plan or open a position — emotions out, discipline in. Know exactly how much to risk before you click buy.',
    image: (
      <div className="relative w-full h-full min-h-[320px] rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 from-10% via-orange-500 via-30% to-red-600 to-90%"/>
        <div className="relative z-10 w-full h-full ml-8 mt-8 ">
          <Image
            src="/screenshots/build-d.png"
            alt="Risk Checker (dark)"
            fill
            className="object-cover object-left-top hidden dark:block rounded-tl-xl"
          />
          <Image
            src="/screenshots/build-l.png"
            alt="Risk Checker (light)"
            fill
            className="object-cover object-left-top block dark:hidden rounded-tl-xl"
          />
        </div>
      </div>
    ),
    buttonText: 'Build Position',
    buttonLink: '/guardian',
  },
  {
    number: '04 / 05',
    title: 'Position Guardian',
    description: 'Once you open a position, Guardian monitors it 24/7. You receive Telegram and in‑app alerts when risk escalates or price approaches your stop‑loss or take‑profit. Close positions manually anytime — stay in control without staring at charts all day. Let the Guardian watch the market for you.',
    image: (
      <div className="relative w-full h-full min-h-[320px] rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-300 from-10% via-pink-500 via-30% to-purple-600 to-90%"/>
        <div className="relative z-10 w-full h-full ml-8 mt-8 ">
          <Image
            src="/screenshots/guardian-d3.png"
            alt="Risk Checker (dark)"
            fill
            className="object-cover object-left-top hidden dark:block rounded-tl-xl"
          />
          <Image
            src="/screenshots/guardian-l.png"
            alt="Risk Checker (light)"
            fill
            className="object-cover object-left-top block dark:hidden rounded-tl-xl"
          />
        </div>
      </div>
    ),
    buttonText: 'Learn More',
    buttonLink: '/guardian',
  },
  {
    number: '05 / 05',
    title: 'Token Comparison Tool',
    description: 'Compare 2–5 tokens side by side in one glance. See overall risk, liquidity, concentration, and AI verdict for each. Quickly pick the safest entry among several candidates — perfect for fast decision‑making when multiple opportunities appear. Stop wondering “which one is safer?” and get the answer in seconds.',
    image: (
      <div className="relative w-full h-full min-h-[320px] rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500  from-10% via-sky-500 via-30% to-blue-600 to-90%"/>
        <div className="relative z-10 w-full h-full ml-8 mt-8 ">
          <Image
            src="/screenshots/compare-d.png"
            alt="Risk Checker (dark)"
            fill
            className="object-cover object-left-top hidden dark:block rounded-tl-xl"
          />
          <Image
            src="/screenshots/compare-l.png"
            alt="Risk Checker (light)"
            fill
            className="object-cover object-left-top block dark:hidden rounded-tl-xl"
          />
        </div>
      </div>
    ),
    buttonText: 'Try Compare',
    buttonLink: '/compare',
  },
];

function AnimatedCard({ card, index, total, scrollYProgress }: { card: CardData; index: number; total: number; scrollYProgress: MotionValue<number> }) {
  // Увеличиваем интервал: каждая карточка появляется на промежутке [index/(total+1), (index+1)/(total+1)]
  // Это даёт больше пространства между карточками
  const start = index / (total + 1);
  const end = (index + 1) / (total + 1);
  const progress = useTransform(scrollYProgress, [start, end], [0, 1]);

  const y = useTransform(progress, [0, 1], [700, 0]); // большее смещение снизу
  const opacity = useTransform(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 1]);
  const scale = useTransform(progress, [0, 1], [0.9, 1]);
  const zIndex = index;

  return (
    <motion.div
      style={{ y, opacity, scale, zIndex }}
      className="absolute w-full max-w-5xl  bg-card dark:bg-[#1c1c1c] shadow-none rounded-2xl border border-border/50 dark:border-border/40 overflow-hidden min-h-[70vh]"
    >
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/2 p-10 flex flex-col justify-between min-h-[70vh]">
        <div className='h-full flex-1 flex flex-col'>
          <div className="text-sm font-mono text-foreground font-semibold mb-2">{card.number}</div>
          <h3 className="text-xl font-medium  tracking-tight text-foreground">{card.title}</h3>
          </div>
          <div className='flex flex-col gap-8'>
          <p className="mt-3 text-foreground font-normal  text-xl leading-normal">{card.description}</p>
          <Link href={card.buttonLink}>
          <Button variant="default" size={"lg"} className="rounded-full px-6 h-12 text-lg cursor-pointer">
              {card.buttonText} 
          </Button>
          </Link>
          </div>
        </div>
        <div className="md:w-1/2  bg-card dark:bg-[#1c1c1c]  flex items-center justify-center p-4">
          {card.image}
        </div>
      </div>
    </motion.div>
  );
}

export default function StickyCardsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  return (
    // Увеличиваем высоту до 600vh (6 экранов) для 4 карточек
    <div ref={containerRef} className="relative h-[800vh] w-full ">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-sidebar px-6">
        <div className='max-w-5xl mx-auto w-full mt-4 relative'>
        <div className='absolute top-4 left-auto'>
        <p className="md:text-left text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            How Tradefend works
          </p>
          <h2 className="mt-3 md:text-left text-center text-xl font-semibold tracking-tight text-foreground md:text-3xl">
          How Tradefend Helps You Not Lose Money
          </h2>
          <p className='text-muted-foreground md:text-left text-center text-sm  mt-1'>We don’t just show you risks — we help you avoid them before they cost you.</p>
          </div>
          </div>
        <div className="relative flex h-full w-full items-center justify-center pt-7">
            
          {cards.map((card, idx) => (
            <AnimatedCard
              key={idx}
              card={card}
              index={idx}
              total={cards.length}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </div>
  );
}