import { useState, useEffect, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ChevronRight, Loader2, Check, X, AlertCircle, RefreshCw, Eye, EyeOff, Key } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { FormField } from "../../components/ui/form-field";
import { safeLocalStorage } from "../../lib/safeStorage";
import { useAppDispatch } from "../../store/hooks";
import { setAuthUser, setAuthProfile } from "../../store/slices/authSlice";
import { identityApi } from "../../services/apiClient";
import { setPersistedUser } from "../../services/auth/authService";

import logo from "@/contents/images/nexa-logo.png";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Username suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  // Validation states
  const [emailTaken, setEmailTaken] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "loading" | "available" | "taken">("idle");
  const [usernameRequirements, setUsernameRequirements] = useState({
    length: false,
    characters: false
  });
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-3
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    number: false,
    uppercase: false,
    special: false
  });

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Redirect if already logged in - Handled by PublicGuard in App.tsx
  /*
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !loading && !success) {
        navigate("/feed");
      }
    });
    return () => unsubscribe();
  }, [navigate]);
  */

  // Real-time Email Check
  useEffect(() => {
    if (!email || !email.includes("@") || !email.includes(".")) {
      setEmailChecked(false);
      setEmailTaken(false);
      setEmailChecking(false);
      return;
    }

    setEmailChecking(true);

    const checkEmail = async () => {
      try {
        const res = await identityApi.checkEmail(email);
        setEmailTaken(!res.available);
        setEmailChecked(true);
      } catch (err: unknown) {
        console.error("Email check error:", err);
        setEmailChecked(true);
        setEmailTaken(false);
      } finally {
        setEmailChecking(false);
      }
    };

    const timeoutId = setTimeout(checkEmail, 800);
    return () => clearTimeout(timeoutId);
  }, [email]);

  // Real-time Username Check
  useEffect(() => {
    const reqs = {
      length: username.length >= 3 && username.length <= 20,
      characters: /^[a-z0-9_]+$/.test(username)
    };
    setUsernameRequirements(reqs);

    if (!reqs.length || !reqs.characters) {
      setUsernameStatus("idle");
      return;
    }

    const checkUsername = async () => {
      setUsernameStatus("loading");
      try {
        const res = await identityApi.checkUsername(username);
        if (res.available) {
          setUsernameStatus("available");
        } else {
          setUsernameStatus("taken");
        }
      } catch (err: unknown) {
        console.error("Username check error:", err);
        setUsernameStatus("available");
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  // Password Strength Check
  useEffect(() => {
    const reqs = {
      length: password.length >= 8,
      number: /[0-9]/.test(password),
      uppercase: /[A-Z]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordRequirements(reqs);

    let strength = 0;
    if (password.length > 0) {
      if (reqs.length) strength++;
      if (reqs.number) strength++;
      if (reqs.uppercase) strength++;
      if (reqs.special) strength++;
      
      // Bonus for extra length
      if (password.length >= 12) strength++;
    }
    
    setPasswordStrength(Math.min(strength, 4));
  }, [password]);

  const isEmailValid = email && email.includes("@") && email.includes(".") && emailChecked && !emailTaken;

  // Generate Username Suggestions
  useEffect(() => {
    if (isEmailValid && !username) {
      const prefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      if (prefix.length >= 2) {
        const variants = [
          prefix,
          `${prefix}${Math.floor(Math.random() * 99)}`,
          `${prefix}_pro`,
          `${prefix}_gamer`,
          `${prefix}_${Math.floor(Math.random() * 999)}`,
          `the_${prefix}`,
          `${prefix}_nex`
        ];
        setSuggestions(variants.filter(v => v.length >= 3 && v.length <= 20));
      }
    } else if (!isEmailValid || username) {
      setSuggestions([]);
    }
  }, [email, username, isEmailValid]);

  const regenerateSuggestions = () => {
    if (suggestions.length > 0) {
      setSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    }
  };

  const applySuggestion = (s: string) => {
    setUsername(s);
    setSuggestions([]);
  };

  const generateStrongPassword = () => {
    const length = 14;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    
    // Ensure at least one of each required type
    retVal += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    retVal += "0123456789"[Math.floor(Math.random() * 10)];
    retVal += "!@#$%^&*()_+"[Math.floor(Math.random() * 12)];
    
    for (let i = 0; i < length - 3; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password
    const shuffled = retVal.split('').sort(() => 0.5 - Math.random()).join('');
    setPassword(shuffled);
    setShowPassword(true);
  };

  const isFormValid = 
    email && 
    !emailTaken && 
    usernameStatus === "available" && 
    usernameRequirements.length &&
    usernameRequirements.characters &&
    passwordStrength >= 3;

  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError("");

    try {
      // API Gateway Register exclusively
      const res = await identityApi.register({
        email,
        username,
        displayName: username,
        password
      });

      const serializedUser = {
        uid: res.user.id,
        email: res.user.email,
        displayName: res.user.displayName,
        photoURL: null,
        emailVerified: res.user.emailVerified,
      };

      setPersistedUser({
        ...serializedUser,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      }, true);

      dispatch(setAuthUser(serializedUser));
      dispatch(setAuthProfile({
        uid: res.user.id,
        displayName: res.user.displayName,
        email: res.user.email,
        photoURL: null,
        plan: res.user.plan.toLowerCase() as any,
        role: res.user.roles[0] as any,
        onboardingCompleted: false,
        createdAt: res.user.createdAt,
      }));

      setSuccess(true);
      toast.success("Account Created via API Gateway!", {
        description: "Checking system requirements and preparing dashboard."
      });
      setTimeout(() => {
        const returnTo = safeLocalStorage.getItem("nx_return_to") || "/onboarding";
        safeLocalStorage.removeItem("nx_return_to");
        navigate(returnTo, { replace: true });
      }, 1000);
    } catch (err: any) {
      console.error("API Gateway signup error:", err);
      let errMsg = "Failed to create account via API Gateway. Please try again.";
      if (err) {
        if (err.message) {
          errMsg = Array.isArray(err.message) ? err.message.join(", ") : err.message;
        } else if (err.error) {
          errMsg = err.error;
        } else if (typeof err === "string") {
          errMsg = err;
        }
      }
      setError(errMsg);
      toast.error("Signup Failed", { description: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen ui-bg-landing flex items-center justify-center p-6 selection:bg-primary/20 selection:text-primary">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] glass rounded-xl shadow-2xl p-8 md:p-10 border border-border/50 relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-tertiary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col items-center mb-8">
            <Link 
              to="/" 
              className="w-12 h-12 bg-background rounded-xl flex items-center justify-center mb-4 shadow-lg border border-border/50 overflow-hidden p-2"
            >
              <img src={logo} alt="nxclip.ai Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </Link>
            <h1 className="text-2xl font-display font-bold text-foreground mb-1 tracking-tight">Create account</h1>
            <p className="text-muted-foreground font-medium text-xs">Join 10,000+ gaming creators</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-medium flex items-center gap-3"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs font-medium">
              We sent a verification link to {email}. You can verify later.
            </div>
          )}

          <form onSubmit={handleEmailSignup} className="space-y-6">
            {/* Email Field */}
            <FormField
              label="Email Address"
              id="email"
              description="Use your gaming or professional email"
              error={emailTaken ? "This email is already registered" : undefined}
              disabled={loading || success}
              required
            >
              <div className="relative group overflow-hidden rounded-xl">
                <Mail className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                  emailTaken ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary"
                )} size={16} />
                <Input 
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailTaken(false);
                    setEmailChecked(false);
                  }}
                  required
                  disabled={loading || success}
                  className={cn(
                    "pl-11 pr-10 py-6 bg-muted/20",
                    emailTaken ? "border-destructive focus-visible:ring-destructive/20" : "border-border/50"
                  )}
                  placeholder="name@example.com"
                />

                {/* Right side loader / check indicators */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {emailChecking && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="text-primary flex items-center justify-center"
                      >
                        <Loader2 size={14} className="animate-spin" />
                      </motion.div>
                    )}
                    {emailChecked && !emailChecking && email && (
                      <motion.div
                        key={emailTaken ? "taken" : "available"}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.15, type: "spring", stiffness: 300, damping: 20 }}
                        className="flex items-center justify-center"
                      >
                        {emailTaken ? (
                          <X size={14} className="text-destructive" />
                        ) : (
                          <Check size={14} className="text-primary" />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Shimmering loader bar under the input */}
                <AnimatePresence>
                  {emailChecking && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden pointer-events-none rounded-b-xl">
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.2,
                          ease: "easeInOut",
                        }}
                        className="w-1/2 h-full bg-gradient-to-r from-transparent via-primary to-transparent"
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </FormField>

            {/* Username Field */}
            <FormField
              label="Username"
              id="username"
              description="Your unique identity on nxclip.ai"
              error={usernameStatus === "taken" ? "This username is already taken" : undefined}
              disabled={loading || success}
              required
            >
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                <Input 
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  required
                  disabled={loading || success}
                  className={cn(
                    "pl-11 pr-10 py-6 bg-muted/20",
                    usernameStatus === "taken" ? "border-destructive focus-visible:ring-destructive/20" : "border-border/50"
                  )}
                  placeholder="johndoe"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameStatus === "loading" && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
                  {usernameStatus === "available" && <Check size={14} className="text-primary" />}
                  {usernameStatus === "taken" && <X size={14} className="text-destructive" />}
                </div>
              </div>
              
              <div className="flex gap-2 mt-2 px-1">
                <div className="flex items-center gap-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", usernameRequirements.length ? "bg-primary shadow-[0_0_8px_var(--color-brand-primary)]" : "bg-muted")} />
                  <span className="text-[8px] font-bold text-muted-foreground uppercase">3-20</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", usernameRequirements.characters ? "bg-primary shadow-[0_0_8px_var(--color-brand-primary)]" : "bg-muted")} />
                  <span className="text-[8px] font-bold text-muted-foreground uppercase">a-z0-9_</span>
                </div>
              </div>

              <AnimatePresence>
                {suggestions.length > 0 && !username && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2 mt-3 px-1"
                  >
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Suggested:</span>
                    <button
                      type="button"
                      onClick={() => applySuggestion(suggestions[suggestionIndex])}
                      className="text-[10px] font-bold text-primary hover:bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 transition-colors"
                    >
                      {suggestions[suggestionIndex]}
                    </button>
                    <button
                      type="button"
                      onClick={regenerateSuggestions}
                      className="p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                      title="Regenerate suggestion"
                    >
                      <RefreshCw size={10} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </FormField>

            {/* Password Field */}
            <FormField
              label="Password"
              id="password"
              description="Keep your account secure with a strong password"
              disabled={loading || success}
              required
            >
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || success}
                  className="pl-11 pr-12 py-6 bg-muted/20 border-border/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              <div className="flex justify-end mt-2">
                {isEmailValid && (
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-wider animate-in fade-in slide-in-from-right-2"
                  >
                    <Key size={10} />
                    Suggest strong password
                  </button>
                )}
              </div>
              
              {/* Strength Bar */}
              <div className="space-y-2 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">Strength</span>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wider transition-colors",
                    passwordStrength <= 1 ? "text-destructive" : 
                    passwordStrength === 2 ? "text-amber-500" : 
                    passwordStrength >= 3 ? "text-primary text-shadow-glow" : ""
                  )}>
                    {passwordStrength === 0 && "None"}
                    {passwordStrength === 1 && "Weak"}
                    {passwordStrength === 2 && "Fair"}
                    {passwordStrength === 3 && "Strong"}
                    {passwordStrength >= 4 && "Excellent"}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div 
                      key={step}
                      className={cn(
                        "h-full flex-1 transition-all duration-500 rounded-full",
                        passwordStrength >= step 
                          ? (passwordStrength <= 1 ? "bg-destructive" : 
                             passwordStrength === 2 ? "bg-amber-500" : "bg-primary shadow-[0_0_8px_var(--color-brand-primary)]")
                          : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Requirements List */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                {[
                  { label: "8+ chars", met: passwordRequirements.length },
                  { label: "1 number", met: passwordRequirements.number },
                  { label: "1 uppercase", met: passwordRequirements.uppercase },
                  { label: "1 special", met: passwordRequirements.special },
                ].map((req) => (
                  <div key={req.label} className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300",
                      req.met ? "bg-primary/20 text-primary scale-110" : "bg-muted/50 text-muted-foreground/20"
                    )}>
                      <Check size={9} strokeWidth={4} />
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wider transition-colors",
                      req.met ? "text-primary" : "text-muted-foreground/30"
                    )}>{req.label}</span>
                  </div>
                ))}
              </div>
            </FormField>

            <Button 
              type="submit"
              disabled={loading || !isFormValid || success}
              variant={success ? "default" : "brand-gradient"}
              size="hero"
              className={cn(
                "w-full",
                success && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-0.5">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span className="font-semibold text-xs tracking-wider uppercase">Registering via API Gateway...</span>
                  </div>
                  <span className="text-[9px] text-white/70 font-normal tracking-wide mt-0.5 lowercase animate-pulse">Initializing user registry handshake</span>
                </div>
              ) : success ? (
                <Check size={20} />
              ) : (
                <>
                  Create account
                  <ChevronRight size={16} />
                </>
              )}
            </Button>
          </form>



          <p className="mt-8 text-center text-xs text-muted-foreground font-medium">
            Already have an account? <Link to="/login" className="text-primary font-bold hover:underline underline-offset-4">Sign in →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
