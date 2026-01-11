import Link from 'next/link';
import { Button } from '@/components/ui';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-purple text-center">
        Project M&M - Video Call Platform
      </h1>
      <p className="mt-4 text-base sm:text-lg text-text-grey text-center">Welcome to the platform</p>
      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
        <Link href="/login" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Login</Button>
        </Link>
        <Link href="/register" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">Register</Button>
        </Link>
      </div>
    </main>
  );
}

