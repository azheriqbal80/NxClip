import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Mail, 
  Lock, 
  Loader2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  KeyRound, 
  ShieldCheck 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { FormField } from "../../components/ui/form-field";
import { identityApi } from "../../services/apiClient";
import { safeLocalStorage } from "../../lib/safeStorage";
import logo from "@/contents/images/nexa-logo.png";

// Validation schemas for each step
const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
});

const codeSchema = z.object({
  code: z.string().length(6, "Verification code must be exactly 6 digits").regex(/^\d+$/, "Code must contain only numbers"),
});

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type EmailForm = z.infer<typeof emailSchema>;
type CodeForm = z.infer<typeof codeSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ForgotPassword() {
  const [step, setStep] = useState<"email" | "code" | "password" | "success">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0); // 0 to 4
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  const navigate = useNavigate();

  // Step 1: Email Form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  // Step 2: Code Form
  const {
    register: registerCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: codeErrors },
    setValue: setCodeValue,
  } = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  // Step 3: Password Form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    watch: watchPassword,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const watchedPassword = watchPassword("password");

  // Calculate password strength in real-time
  useEffect(() => {
    if (!watchedPassword) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (watchedPassword.length >= 8) strength++;
    if (/[A-Z]/.test(watchedPassword) && /[a-z]/.test(watchedPassword)) strength++;
    if (/[0-9]/.test(watchedPassword)) strength++;
    if (/[^A-Za-z0-9]/.test(watchedPassword)) strength++;
    setPasswordStrength(strength);
  }, [watchedPassword]);

  // Handle Step 1 Submit: Request Reset Code
  const onEmailSubmit = async (data: EmailForm) => {
    setLoading(true);
    setError("");
    try {
      const res = await identityApi.forgotPassword(data.email);
      setEmail(data.email);
      
      // Retrieve the generated code from safeLocalStorage for developer sandbox visibility
      const storedCodes = JSON.parse(safeLocalStorage.getItem("nx_reset_codes") || "{}");
      const code = storedCodes[data.email.toLowerCase()];
      if (code) {
        setSimulatedCode(code);
        toast.info("🔑 Secure Sandbox Notification", {
          description: `Reset code generated: ${code}. In production, this is dispatched to the user's secure inbox.`,
          duration: 10000,
        });
      }
      
      toast.success("Security code sent", {
        description: "A secure verification code has been dispatched to your email address.",
      });
      setStep("code");
    } catch (err: any) {
      const msg = err?.message || "Failed to initiate password reset.";
      setError(msg);
      toast.error("Error", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2 Submit: Verify Code
  const onCodeSubmit = async (data: CodeForm) => {
    setLoading(true);
    setError("");
    try {
      // Pre-validate the code on mock endpoint
      await identityApi.resetPassword({
        email,
        code: data.code,
      });
      
      toast.success("Code verified successfully", {
        description: "Please establish your new secure password.",
      });
      setStep("password");
    } catch (err: any) {
      const msg = err?.message || "Invalid or expired verification code.";
      setError(msg);
      toast.error("Verification Failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 3 Submit: Save New Password
  const onPasswordSubmit = async (data: PasswordForm) => {
    setLoading(true);
    setError("");
    try {
      // Finalize the password reset
      const codeFormValue = simulatedCode || ""; // Fallback if lost, but state should hold it
      
      await identityApi.resetPassword({
        email,
        code: codeFormValue,
        newPassword: data.password,
      });

      toast.success("Password reset successfully", {
        description: "Your login credentials have been securely updated.",
      });
      setStep("success");
    } catch (err: any) {
      const msg = err?.message || "Failed to update password.";
      setError(msg);
      toast.error("Update Failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthText = () => {
    switch (passwordStrength) {
      case 0: return "Very Weak";
      case 1: return "Weak";
      case 2: return "Medium";
      case 3: return "Strong";
      case 4: return "Excellent";
      default: return "";
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return "bg-destructive/30";
      case 1: return "bg-destructive";
      case 2: return "bg-yellow-500";
      case 3: return "bg-primary/80";
      case 4: return "bg-primary";
      default: return "bg-muted";
    }
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
            <h1 className="text-2xl font-display font-bold text-foreground mb-2 tracking-tight">
              {step === "email" && "Reset Password"}
              {step === "code" && "Verify Identity"}
              {step === "password" && "New Password"}
              {step === "success" && "Password Reset"}
            </h1>
            <p className="text-muted-foreground font-medium text-xs text-center px-4">
              {step === "email" && "Enter your email to receive a secure password recovery code"}
              {step === "code" && `We've dispatched a secure verification code to ${email}`}
              {step === "password" && "Design a strong cryptographic password to secure your account"}
              {step === "success" && "Your account password has been updated securely"}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm font-medium flex items-center gap-3"
            >
              <AlertCircle size={16} className="shrink-0" />
              <span className="text-xs">{error}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.form
                key="email-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSubmitEmail(onEmailSubmit)}
                className="space-y-6"
              >
                <FormField
                  label="Email Address"
                  id="email"
                  description="We will check our directory for this address"
                  error={emailErrors.email?.message}
                >
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                    <Input 
                      id="email"
                      type="email"
                      {...registerEmail("email")}
                      disabled={loading}
                      className="pl-12 py-6 bg-muted/20 border-border/50 text-foreground"
                      placeholder="name@example.com"
                    />
                  </div>
                </FormField>

                <Button 
                  type="submit"
                  variant="brand-gradient"
                  size="hero"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span className="font-semibold text-xs tracking-wider uppercase">Searching directory...</span>
                    </div>
                  ) : (
                    <>
                      Send recovery code
                      <ChevronRight size={18} />
                    </>
                  )}
                </Button>

                <div className="pt-2 text-center">
                  <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={14} />
                    Back to login
                  </Link>
                </div>
              </motion.form>
            )}

            {step === "code" && (
              <motion.form
                key="code-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSubmitCode(onCodeSubmit)}
                className="space-y-6"
              >
                {simulatedCode && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex flex-col gap-1 items-start">
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-wider">
                      <KeyRound size={12} />
                      Sandbox Code Generated
                    </div>
                    <div className="text-xl font-mono font-bold tracking-widest text-primary/90 mt-1 select-all">
                      {simulatedCode}
                    </div>
                    <button 
                      type="button"
                      onClick={() => setCodeValue("code", simulatedCode)}
                      className="text-[9px] font-bold text-muted-foreground hover:text-primary mt-1.5 underline uppercase tracking-wide transition-colors"
                    >
                      Autofill code for testing
                    </button>
                  </div>
                )}

                <FormField
                  label="Verification Code"
                  id="code"
                  description="Enter the 6-digit cryptographic code sent to you"
                  error={codeErrors.code?.message}
                >
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                    <Input 
                      id="code"
                      type="text"
                      maxLength={6}
                      {...registerCode("code")}
                      disabled={loading}
                      className="pl-12 py-6 bg-muted/20 border-border/50 text-foreground font-mono text-center tracking-[0.4em] text-lg"
                      placeholder="000000"
                    />
                  </div>
                </FormField>

                <Button 
                  type="submit"
                  variant="brand-gradient"
                  size="hero"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span className="font-semibold text-xs tracking-wider uppercase">Verifying token handshake...</span>
                    </div>
                  ) : (
                    <>
                      Verify security code
                      <ChevronRight size={18} />
                    </>
                  )}
                </Button>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Change email
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (email) onEmailSubmit({ email });
                    }}
                    className="text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                  >
                    Resend code
                  </button>
                </div>
              </motion.form>
            )}

            {step === "password" && (
              <motion.form
                key="password-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSubmitPassword(onPasswordSubmit)}
                className="space-y-6"
              >
                <FormField
                  label="New Password"
                  id="password"
                  description="Choose a highly robust, secure password"
                  error={passwordErrors.password?.message}
                >
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...registerPassword("password")}
                      disabled={loading}
                      className="pl-12 pr-12 py-6 bg-muted/20 border-border/50 text-foreground"
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

                  {/* Password Strength indicator */}
                  {watchedPassword && (
                    <div className="mt-3 space-y-1 px-1">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-muted-foreground/60">Entropy Strength:</span>
                        <span className={`font-extrabold ${
                          passwordStrength <= 1 ? "text-destructive" : passwordStrength === 2 ? "text-yellow-500" : "text-primary"
                        }`}>{getStrengthText()}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4].map((index) => (
                          <div 
                            key={index} 
                            className={`h-full flex-1 transition-all duration-300 rounded-sm ${
                              index <= passwordStrength ? getStrengthColor() : "bg-muted/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </FormField>

                <FormField
                  label="Confirm Password"
                  id="confirmPassword"
                  description="Verify correct keystroke entry"
                  error={passwordErrors.confirmPassword?.message}
                >
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                    <Input 
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      {...registerPassword("confirmPassword")}
                      disabled={loading}
                      className="pl-12 pr-12 py-6 bg-muted/20 border-border/50 text-foreground"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormField>

                <Button 
                  type="submit"
                  variant="brand-gradient"
                  size="hero"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span className="font-semibold text-xs tracking-wider uppercase">Updating cryptographic hashes...</span>
                    </div>
                  ) : (
                    <>
                      Save credentials
                      <ChevronRight size={18} />
                    </>
                  )}
                </Button>
              </motion.form>
            )}

            {step === "success" && (
              <motion.div
                key="success-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center pt-2"
              >
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 text-primary mb-6">
                  <CheckCircle2 size={36} />
                </div>
                
                <h2 className="text-xl font-display font-bold text-foreground">Password Changed!</h2>
                <p className="text-muted-foreground text-xs leading-relaxed max-w-[300px] mx-auto">
                  Your security credentials have been updated successfully. You may now log in to nxclip.ai with your new password.
                </p>

                <Button 
                  type="button"
                  variant="brand-premium"
                  size="xl"
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  Go to login page
                  <ChevronRight size={16} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
