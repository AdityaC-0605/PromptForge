import Nav from '@/src/components/landing/Nav';
import Hero from '@/src/components/landing/Hero';
import DemoWindow from '@/src/components/landing/DemoWindow';
import HowItWorks from '@/src/components/landing/HowItWorks';
import Features from '@/src/components/landing/Features';
import StackGrid from '@/src/components/landing/StackGrid';
import CtaSection from '@/src/components/landing/CtaSection';

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}>
      <Nav />
      <Hero />
      <DemoWindow />
      <HowItWorks />
      <Features />
      <StackGrid />
      <CtaSection />
    </div>
  );
}
