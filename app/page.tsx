import React from 'react';
import NEOStrategyPlatform from './components/NEOStrategyPlatform';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <NEOStrategyPlatform />
    </main>
  );
}