import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import finshalaLogo from "@/assets/finshala-logo.png";
import AuthModal from "@/components/AuthModal";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNavigate, Link } from "react-router-dom";
import { GlassEffect } from "@/components/ui/liquid-glass";

const Navbar = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const { user, signOut } = useAuth();
  const { hasProfile } = useUserProfile();
  const navigate = useNavigate();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 30);
  });

  const openLogin = () => { setMenuOpen(false); setAuthMode("login"); setAuthOpen(true); };
  const openSignup = () => { setMenuOpen(false); setAuthMode("signup"); setAuthOpen(true); };
  const handleLogout = async () => { setMenuOpen(false); await signOut(); navigate("/"); };

  return (
    <>
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-12 h-16 transition-all duration-700 ${scrolled
          ? "bg-background/60 backdrop-blur-xl border-b border-border/30 shadow-[0_1px_20px_-6px_hsl(var(--ink)/0.08)]"
          : ""
          }`}
      >
        {/* Left icon */}
        <div className="w-8 h-8 flex items-center justify-center opacity-50">
          <img src={finshalaLogo} alt="" className="h-6 w-6 grayscale opacity-70" />
        </div>

        {/* Center signature */}
        <Link to="/" className="flex flex-col items-center justify-center hover:opacity-100 transition-opacity">
          <span className="text-xl md:text-2xl opacity-90 text-foreground font-bold font-display tracking-tight">ＦＩＮＳＨＡＬＡ</span>
          <AnimatedText
            text=""
            textClassName="hidden"
            underlineClassName="text-foreground"
            underlineDuration={2}
            className="gap-0 -mt-1 w-full"
          />
        </Link>

        {/* Right menu icon */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 flex flex-col items-center justify-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity duration-500"
          >
            <span className="w-5 h-[1px] bg-foreground" />
            <span className="w-5 h-[1px] bg-foreground" />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-10 min-w-[160px] z-[100]"
            >
              <GlassEffect className="py-2 rounded-xl flex flex-col w-full">
              {user ? (
                <>
                  <div className="px-4 py-2 text-xs font-body text-foreground border-b border-border/30 mb-1">
                    {user.email}
                  </div>
                  <button onClick={() => { setMenuOpen(false); navigate("/account"); }} className="w-full text-left px-4 py-2 text-sm font-body text-foreground hover:bg-white/20 transition-colors">
                    Account
                  </button>

                  {!hasProfile ? (
                    <button onClick={() => { setMenuOpen(false); navigate("/fire-onboarding"); }} className="w-full text-left px-4 py-2 text-sm font-body text-foreground hover:bg-white/20 transition-colors">
                      Fire Onboarding
                    </button>
                  ) : (
                    <button onClick={() => { setMenuOpen(false); navigate("/fire-dashboard"); }} className="w-full text-left px-4 py-2 text-sm font-body text-foreground hover:bg-white/20 transition-colors">
                      Fire Planner
                    </button>
                  )}
                  <button onClick={() => { setMenuOpen(false); navigate("/money-health"); }} className="w-full text-left px-4 py-2 text-sm font-body text-foreground hover:bg-white/20 transition-colors">
                    Money Health
                  </button>
                  <button onClick={() => { setMenuOpen(false); navigate("/tax-wizard"); }} className="w-full text-left px-4 py-2 text-sm font-body text-foreground hover:bg-white/20 transition-colors">
                    Tax Wizard
                  </button>
                  <button onClick={() => { setMenuOpen(false); navigate("/ai-shala"); }} className="w-full text-left px-4 py-2 text-sm font-body text-foreground hover:bg-white/20 transition-colors">
                    AI Shala
                  </button>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-body text-red-500 hover:bg-white/20 transition-colors">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={openLogin} className="w-full text-left px-4 py-2 text-sm font-body text-foreground hover:bg-white/20 transition-colors">
                    Log in
                  </button>
                  <button onClick={openSignup} className="w-full text-left px-4 py-2 text-sm font-body text-foreground hover:bg-white/20 transition-colors">
                    Sign up
                  </button>
                </>
              )}
              </GlassEffect>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Close dropdown when clicking outside */}
      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />}

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} setMode={setAuthMode} />
    </>
  );
};

export default Navbar;
