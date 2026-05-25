'use client';
import { useEffect, useRef, useState } from 'react';

export function ProblemSection() {
  const [trigger, setTrigger] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !trigger) {
          setTrigger(true);
        }
      },
      { threshold: 0.3 }
    );

    if (spanRef.current) observer.observe(spanRef.current);
    return () => observer.disconnect();
  }, [trigger]);

  const handleAnimationEnd = () => {
    // Небольшая задержка помогает браузеру правильно применить CSS-классы
    setTimeout(() => {
      setAnimationDone(true);
    }, 50);
  };

  return (
    <section className="py-20 w-full h-screen bg-background dark:bg-[#1c1c1c] flex items-center justify-center flex-col sticky top-0 z-0">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-6xl font-bold mb-8">
          <span
            ref={spanRef}
            className={`inline text-foreground transition-colors duration-0
              ${trigger && !animationDone ? 'gradient-text' : ''}`}
            onAnimationEnd={trigger && !animationDone ? handleAnimationEnd : undefined}
          >
            Most traders lose money because they don&apos;t see the full picture
          </span>
        </h2>

        <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400">
          They check price and volume, then get wrecked by hidden risks. Tradefend changes that.
        </p>
      </div>

      <style jsx>{`
        .gradient-text {
          background-image: linear-gradient(
            90deg,
            #000 0%,
            #000 33.33%,
            #82BCFF 40%,
            #2483FF 45%,
            #FF66F4 50%,
            #FF3029 55%,
            #FE7B02 60%,
            transparent 66.67%,
            transparent
          );
          background-size: 300% 100%;
          background-position: 100% 0;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: gradient-sweep 1.2s cubic-bezier(0.455, 0.03, 0.515, 0.955) forwards 0.1s;
        }

        @keyframes gradient-sweep {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
      `}</style>
    </section>
  );
}