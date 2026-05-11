import Navbar from "@/components/Navbar";
import HeroPanels from "@/components/HeroPanels";
import FeatureFirePath from "@/components/FeatureFirePath";
import FeatureMoneyHealth from "@/components/FeatureMoneyHealth";
import FeatureTaxWizard from "@/components/FeatureTaxWizard";
import FeatureAiShala from "@/components/FeatureAiShala";
import { GlassFilter } from "@/components/ui/liquid-glass";
import { HeroSection } from "@/components/ui/hero-section-with-smooth-bg-shader";

const Index = () => (
  <HeroSection
    distortion={1.2}
    speed={0.8}
    colors={[
      "#FFFFFF", // soft highlight glow
      "#F5E6D8", // light creamy blur
      "#DCC2A8", // pale beige highlight
      "#C9A88D", // light skin tone
      "#B0896F", // soft beige-brown
      "#9B735A", // warm tan
    ]}
  >
    <div className="min-h-screen bg-transparent paper-grain relative z-10 w-full">
      <GlassFilter />
      <Navbar />
      <HeroPanels />
      <FeatureAiShala />
      <FeatureFirePath />
      <FeatureMoneyHealth />
      <FeatureTaxWizard />
    </div>
  </HeroSection>
);

export default Index;
