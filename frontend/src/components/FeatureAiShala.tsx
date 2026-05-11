import { motion } from "framer-motion";
import { Brain, Sparkles, Activity, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedCardStack from "@/components/ui/animate-card-animation";
import { CursorDotField } from "@/components/ui/cursor-dot-field";

const FeatureAiShala = () => {
  const navigate = useNavigate();

  return (
    <section
      id="features-section"
      className="relative py-24 md:py-32 px-6 md:px-12 overflow-hidden bg-background/50 backdrop-blur-3xl"
    >
      {/* Interactive cursor-reactive dot field — dark dots on parchment */}
      <CursorDotField
        dotColor="rgba(0, 0, 0, 0.35)"
        dotSize={2}
        gap={26}
        radius={160}
        className="z-[1] pointer-events-auto"
      />

      {/* Main content */}
      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Side */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <p className="section-label mb-4">
            Agentic Intelligence · Explainable AI · Stress Testing
          </p>

          <h2 className="section-title mb-5">AI Shala</h2>

          <p className="section-subtitle max-w-xl mb-8">
            Five specialized AI agents collaborate to explain your health
            score, optimize your taxes, and stress-test your FIRE plan against
            synthetic market crises — all powered by deterministic engines
            with AI-generated insights.
          </p>

          <ul className="space-y-4 mb-8">
            {[
              { icon: Brain, label: "Multi-Agent Orchestration" },
              { icon: Search, label: "Explainable AI (SHAP-style)" },
              { icon: Activity, label: "Monte Carlo Stress Testing" },
              { icon: Sparkles, label: "Generative UI Dashboard" },
            ].map((feature, i) => (
              <li
                key={i}
                className="flex items-center gap-3 font-body text-sm text-muted-foreground"
              >
                <feature.icon size={16} className="text-muted-foreground/60" strokeWidth={1.5} />
                {feature.label}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/ai-shala")}
              className="font-body text-xs tracking-[0.2em] uppercase border border-foreground px-6 py-3 hover:bg-foreground hover:text-background transition-all duration-500"
            >
              Launch AI Engine
            </button>
            <span className="font-body text-xs text-muted-foreground tracking-widest">
              5 AI Agents
            </span>
          </div>
        </motion.div>

        {/* Right Side: Animated Card Stack */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <AnimatedCardStack />
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureAiShala;
