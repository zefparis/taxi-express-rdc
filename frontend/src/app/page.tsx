'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering theme components after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 dark:border-gray-700 bg-gradient-to-b from-zinc-200 dark:from-dark-200 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:p-4">
          Taxi Express RDC
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white dark:from-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex place-items-center gap-2 p-8 lg:p-0"
          >
            {theme === 'dark' ? '🌙 Mode Clair' : '☀️ Mode Sombre'}
          </button>
        </div>
      </div>

      <div className="relative flex place-items-center">
        <h1 className="text-4xl md:text-6xl font-bold text-center">
          Bienvenue sur <span className="text-primary-600">Taxi Express RDC</span>
        </h1>
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:grid-cols-3 lg:text-left gap-8">
        <Link
          href="/auth/login"
          className="card group hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-dark-200"
        >
          <h2 className="mb-3 text-2xl font-semibold text-primary-600">
            Clients{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-70">
            Réservez un taxi en quelques clics et suivez votre course en temps réel.
          </p>
        </Link>

        <Link
          href="/auth/login?role=driver"
          className="card group hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-dark-200"
        >
          <h2 className="mb-3 text-2xl font-semibold text-primary-600">
            Chauffeurs{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-70">
            Rejoignez notre réseau de chauffeurs et maximisez vos revenus.
          </p>
        </Link>

        <Link
          href="/about"
          className="card group hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-dark-200"
        >
          <h2 className="mb-3 text-2xl font-semibold text-primary-600">
            À propos{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-70">
            Découvrez notre mission et nos services pour la République Démocratique du Congo.
          </p>
        </Link>
      </div>
    </main>
  );
}
