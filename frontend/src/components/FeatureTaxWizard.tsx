import { motion } from "framer-motion";
import { useState } from "react";
import { Upload, GitCompare, Search, BarChart3 } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

// --- Tax Wizard accordion items with relevant Unsplash images ---
const taxAccordionItems = [
  {
    id: 1,
    title: "Upload Form 16",
    icon: Upload,
    imageUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2072&auto=format&fit=crop",
    desc: "Or manually input your salary structure — either way, the AI picks up every line item.",
  },
  {
    id: 2,
    title: "Missed Deductions",
    icon: Search,
    imageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop",
    desc: "AI cross-references 80C, 80D, HRA, NPS, and 20+ sections to surface what you're leaving on the table.",
  },
  {
    id: 3,
    title: "Old vs. New Regime",
    icon: GitCompare,
    imageUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
    desc: "Side-by-side comparison modeled with your specific numbers — not generic calculators.",
  },
  {
    id: 4,
    title: "Ranked Suggestions",
    icon: BarChart3,
    imageUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop",
    desc: "Tax-saving investments ranked by your risk profile and liquidity needs, not one-size-fits-all lists.",
  },
];

// --- Accordion Panel Sub-Component ---
const TaxAccordionPanel = ({
  item,
  isActive,
  onMouseEnter,
}: {
  item: (typeof taxAccordionItems)[number];
  isActive: boolean;
  onMouseEnter: () => void;
}) => {
  const Icon = item.icon;
  return (
    <div
      className={`
        relative overflow-hidden cursor-pointer
        transition-all duration-700 ease-in-out
        ${isActive ? "flex-[4] min-w-0" : "flex-[0.6] min-w-0"}
      `}
      style={{ height: "420px" }}
      onMouseEnter={onMouseEnter}
    >
      {/* Background Image — blurred when inactive */}
      <img
        src={item.imageUrl}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out"
        style={{
          transform: isActive ? "scale(1)" : "scale(1.15)",
          filter: isActive ? "blur(0px)" : "blur(6px)",
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).onerror = null;
          (e.target as HTMLImageElement).src =
            "https://placehold.co/400x420/2d3748/ffffff?text=Image+Error";
        }}
      />

      {/* Dark gradient overlay — stronger on inactive */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: isActive
            ? "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)"
            : "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* Active state: Full content */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 p-6 md:p-8
          transition-all duration-500 ease-in-out
          ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
        `}
      >
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5 text-white/80" strokeWidth={1.5} />
          <span
            className="font-display text-sm tracking-[0.2em] uppercase"
            style={{ color: "hsl(38, 30%, 92%)" }}
          >
            Step {String(item.id).padStart(2, "0")}
          </span>
        </div>
        <h3 className="font-display text-2xl md:text-3xl font-normal text-white mb-2 leading-tight">
          {item.title}
        </h3>
        <p className="font-body text-sm text-white/70 leading-relaxed max-w-md">
          {item.desc}
        </p>
      </div>

      {/* Inactive state: Vertical text — reads bottom to top */}
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-white text-sm font-display tracking-[0.15em] uppercase whitespace-nowrap"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}
          >
            {item.title}
          </span>
        </div>
      )}
    </div>
  );
};

// --- Main Feature Section ---
const FeatureTaxWizard = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="py-24 md:py-32 px-6 md:px-12 bg-background/50 backdrop-blur-3xl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-16 md:mb-20 text-right"
        >
          <p className="section-label mb-4">Upload · Analyze · Save</p>
          <h2 className="section-title mb-4">Tax Wizard</h2>
          <p className="section-subtitle max-w-2xl ml-auto">
            Upload your Form 16 or input your salary structure. AI identifies every
            deduction you're missing and models both regimes with your real numbers.
          </p>
        </motion.div>

        {/* Interactive Image Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.9, delay: 0.15 }}
        >
          <div className="flex flex-row items-stretch gap-3 w-full">
            {taxAccordionItems.map((item, index) => (
              <TaxAccordionPanel
                key={item.id}
                item={item}
                isActive={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 flex items-center justify-end gap-6"
        >
          <button
            onClick={() => {
              if (user) navigate("/tax-wizard");
              else setAuthOpen(true);
            }}
            className="font-body text-xs tracking-[0.2em] uppercase border border-foreground px-6 py-3 hover:bg-foreground hover:text-background transition-all duration-500"
          >
            Optimize My Taxes
          </button>
        </motion.div>
      </div>
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        mode={authMode}
        setMode={setAuthMode}
      />
    </section>
  );
};

export default FeatureTaxWizard;
