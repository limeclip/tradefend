"use client";

import { useState } from "react";
import {  Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";

export default function Header() {
  const { session, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const widePaths = ['/about', '/pricing'];
  const isWidePage = widePaths.some(path => pathname?.startsWith(path));
  const maxWidthClass = isWidePage ? 'max-w-6xl' : 'max-w-5xl';

  const navLinks = !loading
    ? session
      ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/pricing", label: "Pricing" },
        { href: "/faq", label: "FAQ" },
      ]
      : [
        { href: "/pricing", label: "Pricing" },
        { href: "/about", label: "About" },
        { href: "/faq", label: "FAQ" },
      ]
    : [];

  return (
    <header className={cn('mx-auto flex h-20 w-full items-center justify-between px-6', maxWidthClass)}>
      {/* Логотип */}
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
          <span className="font-semibold tracking-tight text-foreground text-lg">Tradefend</span>
        </div>
      </Link>

      {/* Десктопное меню */}
      <div className="hidden md:flex items-center space-x-2">
        {!loading && (
          <>
            {session ? (
              <>
                <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl text-muted-foreground")}>
                  Dashboard
                </Link>
                <Link href="/pricing" className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl text-muted-foreground")}>
                  Pricing
                </Link>
                <Link href="/faq" className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl text-muted-foreground")}>
                  FAQ
                </Link>
              </>
            ) : (
              <>
                <Link href="/pricing" className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl text-muted-foreground")}>
                  Pricing
                </Link>
                <Link href="/about" className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl text-muted-foreground")}>
                  About
                </Link>
                <Link href="/faq" className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl text-muted-foreground")}>
                  FAQ
                </Link>
              </>
            )}
          </>
        )}
      </div>

      {/* Правая часть */}
      <div className="flex items-center gap-2">
        {!loading && (
          <>
            {session ? (
              <>
                <Link href="https://x.com/Tradefend" className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl text-muted-foreground")} target="_blank">
                  {/* иконка X */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" className="h-4 w-4"><path d="M13.808 10.469 20.88 2h-1.676l-6.142 7.353L8.158 2H2.5l7.418 11.12L2.5 22h1.676l6.486-7.765L15.842 22H21.5l-7.693-11.531Zm-2.296 2.748-.752-1.107L4.86 3.3h2.576l4.826 7.11.751 1.107 6.273 9.242h-2.576l-5.118-7.541Z" stroke="currentColor" stroke-width="1.25" fill="none"></path></svg>
                </Link>
                <Button onClick={signOut} variant="outline" className="rounded-xl">
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="https://x.com/Tradefend" className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl text-muted-foreground")} target="_blank">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" className="h-4 w-4"><path d="M13.808 10.469 20.88 2h-1.676l-6.142 7.353L8.158 2H2.5l7.418 11.12L2.5 22h1.676l6.486-7.765L15.842 22H21.5l-7.693-11.531Zm-2.296 2.748-.752-1.107L4.86 3.3h2.576l4.826 7.11.751 1.107 6.273 9.242h-2.576l-5.118-7.541Z" stroke="currentColor" stroke-width="1.25" fill="none"></path></svg>
                </Link>
                <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl text-muted-foreground")}>
                  Sign in
                </Link>
                <Link href="/register" className={cn(buttonVariants(), "rounded-xl")}>
                  Get started
                </Link>
              </>
            )}
          </>
        )}
        <ThemeToggle />

        {/* Мобильное меню (исправленное) */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger>
            <Button variant="ghost" size="icon" className="md:hidden rounded-xl">
              <div className="group/button inline-flex shrink-0 items-center justify-center border border-input bg-transparent hover:bg-accent hover:text-accent-foreground rounded-xl p-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px]">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-8 flex flex-col space-y-4 px-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-foreground hover:text-muted-foreground transition"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-border" />
              {session ? (
                <Button onClick={() => { signOut(); setOpen(false); }} variant="outline" className="rounded-xl w-full">
                  Sign out
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl w-full justify-center")}>
                    Sign in
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className={cn(buttonVariants(), "rounded-xl w-full justify-center")}>
                    Get started
                  </Link>
                </div>
              )}

            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}