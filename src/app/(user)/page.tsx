// app/page.tsx

import HeroSection from "@/components/home/HeroSection";
import BenefitsSection from "@/components/home/BenefitsSection";
import AboutSection from "@/components/home/AboutSection";

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <HeroSection />
      <BenefitsSection />
      <AboutSection />
    </main>
  );
}
