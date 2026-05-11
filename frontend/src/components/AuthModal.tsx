import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "login" | "signup";
  setMode: (mode: "login" | "signup") => void;
}

const inputClass = "w-full px-4 py-2.5 rounded-lg bg-muted/50 border border-border/50 text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";
const labelClass = "block text-xs font-body text-muted-foreground mb-1.5";

const AuthModal = ({ open, onOpenChange, mode, setMode }: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password, {
          full_name: name,
          date_of_birth: dob,
          gender,
          marital_status: maritalStatus,
          employment_type: employmentType,
        });
        if (error) {
          setError(error.message);
        } else {
          onOpenChange(false);
          navigate("/fire-onboarding");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          onOpenChange(false);
          navigate("/fire-onboarding");
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/40 bg-background p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-editorial text-2xl text-foreground">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-body text-sm mt-1">
              {mode === "login"
                ? "Sign in to access your financial dashboard"
                : "Start your journey to financial independence"}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-body">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 text-sm font-body">
              {success}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {mode === "signup" && (
                <>
                  <div>
                    <label className={labelClass}>Full name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Vinayaka" required />
                  </div>

                  <div>
                    <label className={labelClass}>Date of birth</label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputClass} required />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Gender</label>
                      <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass} required>
                        <option value="" disabled>Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Marital status</label>
                      <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className={inputClass} required>
                        <option value="" disabled>Select</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Employment type</label>
                    <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className={inputClass} required>
                      <option value="" disabled>Select</option>
                      <option value="salaried">Salaried</option>
                      <option value="self_employed">Self Employed</option>
                      <option value="business">Business Owner</option>
                      <option value="freelancer">Freelancer</option>
                      <option value="student">Student</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" required />
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" required minLength={6} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 rounded-lg bg-foreground text-background text-sm font-body font-medium hover:bg-foreground/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? (mode === "login" ? "Signing in..." : "Creating account...")
                  : (mode === "login" ? "Sign in" : "Create account")}
              </button>
            </motion.form>
          </AnimatePresence>

          <p className="text-center text-xs text-muted-foreground font-body mt-6">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setSuccess(null); }}
              className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
            >
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
