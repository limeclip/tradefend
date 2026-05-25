import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8 min-h-screen items-center justify-center bg-background dark:bg-sidebar px-6 py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.05),transparent_55%)]" />
      <div className="z-10">
      <Link href="/">
        <div className="flex items-center gap-2">
          <Image
            src={"/logo-d.png"}
            alt="Tradefend"
            width={500}
            height={600}
            className="w-8 h-auto hidden dark:block"
          />
          <Image
            src={"/logo.png"}
            alt="Tradefend"
            width={500}
            height={600}
            className="w-8 h-auto block dark:hidden"
          />
          <span className="font-semibold tracking-tight text-foreground text-xl">Tradefend</span>
        </div>
      </Link>

      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
