import React from 'react';
import Navbar from './onboarding/navbar';
import Hero from './onboarding/hero';
import Features from './onboarding/features';
import Perks from './onboarding/perks';
import CTA from './onboarding/cta';
import Footer from './onboarding/footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="relative">
        <Hero />
        <Features />
        <Perks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};