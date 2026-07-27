import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, ChevronRight } from "lucide-react";
import { motion, useAnimation } from "motion/react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { FormField } from "../../components/ui/form-field";
import { useAppDispatch } from "../../store/hooks";
import { setGlobalError } from "../../store/slices/uiSlice";
import { setAuthUser, setAuthProfile } from "../../store/slices/authSlice";
import { identityApi } from "../../services/apiClient";
import { safeLocalStorage } from "../../lib/safeStorage";
import { setPersistedUser } from "../../services/auth/authService";

import logo from "@/contents/images/nexa-logo.png";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [rememberMe, setRememberMe] = useState(() => {
    return safeLocalStorage.getItem("nx_remember_me") !== "false";
  });

  useEffect(() => {
    safeLocalStorage.setItem("nx_remember_me", rememberMe ? "true" : "false");
  }, [rememberMe]);
  
  const navigate = useNavigate();
  const controls = useAnimation();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
    resetField,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Lockout Timer
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const handleEmailLogin = async (data: LoginFormData) => {
    if (lockoutTime > 0) return;

    setLoading(true);
    setError("");

    try {
      const res = await identityApi.login(data.email, data.password);

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
      }, rememberMe);

      dispatch(setAuthUser(serializedUser));
      dispatch(setAuthProfile({
        uid: res.user.id,
        displayName: res.user.displayName,
        email: res.user.email,
        photoURL: null,
        plan: res.user.plan.toLowerCase() as any,
        role: res.user.roles[0] as any,
        onboardingCompleted: res.user.onboardingCompleted ?? false,
        createdAt: res.user.createdAt,
      }));

      const returnTo = safeLocalStorage.getItem("nx_return_to") || "/feed";
      safeLocalStorage.removeItem("nx_return_to");
      toast.success("Successfully logged in");
      dispatch(setGlobalError(null));
      navigate(returnTo);
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      let errMsg = "Email or password is incorrect.";
      if (err) {
        if (err.message) {
          errMsg = Array.isArray(err.message) ? err.message.join(", ") : err.message;
        } else if (err.error) {
          errMsg = err.error;
        } else if (typeof err === "string") {
          errMsg = err;
        }
      }
      if (newAttempts >= 5) {
        setLockoutTime(900);
        errMsg = "Too many attempts. Your account is temporarily locked. Try again in 15 minutes.";
      }
      
      setError(errMsg);
      toast.error("Login Failed", { description: errMsg });
      dispatch(setGlobalError({ message: errMsg, code: err?.code || "auth/invalid-credentials", context: "Email Login" }));
      
      controls.start({
        x: [-10, 10, -10, 10, 0],
        transition: { duration: 0.2 }
      });
      resetField("password");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen ui-bg-landing flex items-center justify-center p-6 selection:bg-primary/20 selection:text-primary">
      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="w-full max-w-[440px] glass rounded-xl shadow-2xl p-8 md:p-10 border border-border/50 relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-tertiary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col items-center mb-10">
            <Link 
              to="/" 
              className="w-14 h-14 bg-background rounded-xl flex items-center justify-center mb-6 shadow-lg hover:scale-105 transition-transform border border-border/50 overflow-hidden p-2"
            >
              <img src={logo} alt="nxclip.ai Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </Link>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2 tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground font-medium text-sm">Continue your creator journey</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm font-medium flex items-center gap-3"
            >
              <AlertCircle size={16} className="shrink-0" />
              <span>
                {error}
                {lockoutTime > 0 && <span className="block mt-1 font-bold">Retry in: {formatTime(lockoutTime)}</span>}
              </span>
            </motion.div>
          )}

          <motion.form 
            animate={controls}
            onSubmit={handleSubmit(handleEmailLogin)} 
            className="space-y-6"
          >
            <FormField
              label="Email Address"
              id="email"
              description="Enter the email associated with your account"
              disabled={lockoutTime > 0}
              error={errors.email?.message}
            >
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                <Input 
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  disabled={lockoutTime > 0}
                  className="pl-12 py-6 bg-muted/20 border-border/50"
                  placeholder="name@example.com"
                />
              </div>
            </FormField>

            <FormField
              label="Password"
              id="password"
              description="Keep your account secure"
              disabled={lockoutTime > 0}
              error={errors.password?.message}
            >
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  disabled={lockoutTime > 0}
                  className="pl-12 pr-12 py-6 bg-muted/20 border-border/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex items-center justify-between mt-3 select-none">
                <label className="flex items-center gap-2 cursor-pointer group text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                    rememberMe 
                      ? "bg-primary border-primary text-primary-foreground shadow-[0_0_10px_rgba(235,94,85,0.2)]" 
                      : "bg-muted/20 border-border/50 group-hover:border-primary/50"
                  }`}>
                    {rememberMe && (
                      <svg className="w-2.5 h-2.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="font-semibold text-xs tracking-wide">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">Forgot password?</Link>
              </div>
            </FormField>

            <Button 
              type="submit"
              variant="brand-gradient"
              size="hero"
              disabled={loading || lockoutTime > 0}
              className="w-full"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-0.5">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span className="font-semibold text-xs tracking-wider uppercase">Connecting to API Gateway...</span>
                  </div>
                  <span className="text-[9px] text-white/70 font-normal tracking-wide mt-0.5 lowercase animate-pulse">Securing encrypted token handshake</span>
                </div>
              ) : (
                <>
                  Sign in
                  <ChevronRight size={18} />
                </>
              )}
            </Button>
          </motion.form>

          <p className="mt-10 text-center text-sm text-muted-foreground font-medium">
            No account? <Link to="/signup" className="text-primary font-bold hover:underline underline-offset-4">Sign up →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
