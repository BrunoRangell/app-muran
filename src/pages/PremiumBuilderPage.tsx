import { Suspense } from 'react';
import { PremiumBuilder } from '@/components/premium-builder/PremiumBuilder';

const PremiumBuilderPage = () => (
  <Suspense fallback={
    <div className="h-screen flex items-center justify-center bg-[#0B0F1A] text-white/60">
      Carregando Premium Builder…
    </div>
  }>
    <PremiumBuilder />
  </Suspense>
);

export default PremiumBuilderPage;
