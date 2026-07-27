import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  Loader2, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  Mail, 
  Code,
  CheckCircle2,
  Globe,
  Clock,
  RefreshCw,
  WifiOff
} from "lucide-react";
import { toast } from "sonner";
import { identityApi } from "../../services/apiClient";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { selectAuthProvider } from "../../store/slices/uiSlice";
import { selectAuthUser, selectAuthProfile, setAuthUser, logoutUser } from "../../store/slices/authSlice";
import { getPersistedUser, setPersistedUser, updateAccessToken, triggerTokenStateUpdate } from "../../services/auth/authService";
import logo from "../../contents/images/nexa-logo.png";
import { Button } from "../../components/ui/button";

// Helper to decode JWT token expiration
const getJwtExpirationSeconds = (token: string): number | null => {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload && typeof payload.exp === "number") {
      const remaining = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
      return remaining;
    }
  } catch (err) {
    console.error("Error parsing JWT for expiration:", err);
  }
  return null;
};

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authProvider = useAppSelector(selectAuthProvider);
  const user = useAppSelector(selectAuthUser);
  const profile = useAppSelector(selectAuthProfile);

  const [token, setToken] = useState(tokenFromUrl);
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(tokenFromUrl ? "verifying" : "idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [devTokenLoading, setDevTokenLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);
  const [srAnnouncement, setSrAnnouncement] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Handle online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection Restored", {
        description: "Your network connection has been successfully restored.",
      });
      setSrAnnouncement("Your network connection has been restored. Verification countdowns have resumed.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Connection Lost", {
        description: "You are currently offline. Verification progress and countdowns are paused.",
      });
      setSrAnnouncement("Connection lost. You are currently offline. Verification progress and countdowns have been paused.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Effect to handle SR announcements for session expiration countdown
  useEffect(() => {
    if (sessionTimeRemaining === null) return;
    if (sessionTimeRemaining === 0) {
      setSrAnnouncement("Verification session expired. Please renew your secure session.");
    } else if (sessionTimeRemaining === 30) {
      setSrAnnouncement("Warning: Verification session expires in 30 seconds.");
    } else if (sessionTimeRemaining === 60) {
      setSrAnnouncement("Verification session expires in 1 minute.");
    } else if (sessionTimeRemaining > 0 && sessionTimeRemaining % 60 === 0) {
      setSrAnnouncement(`Verification session expires in ${sessionTimeRemaining / 60} minutes.`);
    }
  }, [sessionTimeRemaining]);

  // Effect to handle SR announcements for resend verification cooldown
  useEffect(() => {
    if (countdown === 0) {
      if (user?.email || emailInput) {
        setSrAnnouncement("You can now resend the verification email link.");
      }
    } else if (countdown === 60) {
      setSrAnnouncement("Verification link sent. Please wait 1 minute before resending.");
    } else if (countdown === 30) {
      setSrAnnouncement("30 seconds remaining before you can resend verification.");
    }
  }, [countdown, user?.email, emailInput]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0 || !isOnline) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown, isOnline]);

  // Redirect if already verified
  useEffect(() => {
    if (user && user.emailVerified) {
      if (profile && !profile.onboardingCompleted) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/feed", { replace: true });
      }
    }
  }, [user, profile, navigate]);

  // Silent periodic polling to check if the email has been verified
  useEffect(() => {
    if (!user || user.emailVerified || status === "success" || !isOnline) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await identityApi.getMe();
        const isVerified = res?.emailVerified ?? res?.user?.emailVerified ?? false;
        
        if (isVerified) {
          dispatch(setAuthUser({
            ...user,
            emailVerified: true
          }));

          const persisted = getPersistedUser();
          if (persisted) {
            setPersistedUser({
              ...persisted,
              emailVerified: true
            }, true);
          }

          toast.success("Email Verified!", {
            description: "Your email has been successfully attested. Welcome to the platform!",
          });
        }
      } catch (err) {
        console.debug("Silent verification check failed:", err);
      }
    }, 4000); // Poll every 4 seconds

    return () => clearInterval(pollInterval);
  }, [user, status, dispatch, isOnline]);

  // Effect to calculate and monitor access token expiration
  useEffect(() => {
    const token = getPersistedUser()?.accessToken || "";
    if (!token) {
      setSessionTimeRemaining(300); // 5 minutes fallback for mock/no-token sessions
      setSessionExpired(false);
      return;
    }

    const expSeconds = getJwtExpirationSeconds(token);
    if (expSeconds !== null) {
      setSessionTimeRemaining(expSeconds);
      setSessionExpired(expSeconds <= 0);
    } else {
      setSessionTimeRemaining((prev) => (prev !== null ? prev : 300));
      setSessionExpired(false);
    }
  }, [user]);

  // Session expiration countdown timer with auto-refresh fallback
  useEffect(() => {
    if (!isOnline) return;
    if (sessionTimeRemaining === null || sessionTimeRemaining <= 0) {
      if (sessionTimeRemaining === 0 && !sessionExpired) {
        // Silent automatic token refresh fallback
        const attemptAutoRefresh = async () => {
          const refreshToken = getPersistedUser()?.refreshToken;
          if (refreshToken) {
            try {
              console.log("Token expired. Attempting automatic silent refresh...");
              const res = await identityApi.refresh(refreshToken);
              if (res && res.accessToken) {
                updateAccessToken(res.accessToken, res.refreshToken);
                triggerTokenStateUpdate();
                const currentUser = getPersistedUser();
                dispatch(setAuthUser({
                  uid: currentUser.uid,
                  email: currentUser.email,
                  displayName: currentUser.displayName,
                  photoURL: currentUser.photoURL,
                  emailVerified: currentUser.emailVerified
                }));
                
                const expSeconds = getJwtExpirationSeconds(res.accessToken);
                setSessionTimeRemaining(expSeconds !== null ? expSeconds : 300);
                setSessionExpired(false);
                toast.success("Verification session automatically renewed!");
                return;
              }
            } catch (e) {
              console.error("Auto refresh on countdown expiry failed:", e);
            }
          }
          setSessionExpired(true);
        };
        attemptAutoRefresh();
      }
      return;
    }

    const interval = setInterval(() => {
      setSessionTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionTimeRemaining, sessionExpired, dispatch, isOnline]);

  const handleRefreshSession = async () => {
    if (!isOnline) {
      toast.error("Network Offline", {
        description: "Please check your internet connection before renewing your session.",
      });
      return;
    }

    const refreshToken = getPersistedUser()?.refreshToken;
    if (!refreshToken) {
      toast.error("No refresh token found. Please sign in again.");
      setSessionExpired(true);
      return;
    }

    setIsRefreshingSession(true);
    try {
      const res = await identityApi.refresh(refreshToken);
      if (res && res.accessToken) {
        updateAccessToken(res.accessToken, res.refreshToken);
        triggerTokenStateUpdate();
        
        const currentUser = getPersistedUser();
        dispatch(setAuthUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          emailVerified: currentUser.emailVerified
        }));

        const expSeconds = getJwtExpirationSeconds(res.accessToken);
        if (expSeconds !== null) {
          setSessionTimeRemaining(expSeconds);
          setSessionExpired(expSeconds <= 0);
        } else {
          setSessionTimeRemaining(300);
          setSessionExpired(false);
        }

        toast.success("Session Renewed!", {
          description: "Your verification window has been successfully extended.",
        });
      } else {
        throw new Error("Invalid response from refresh API");
      }
    } catch (err: any) {
      console.error("Manual refresh failed:", err);
      setSessionExpired(true);
      toast.error("Session Expiry", {
        description: "Could not restore your secure verification session. Please sign in again.",
      });
    } finally {
      setIsRefreshingSession(false);
    }
  };

  // Update emailInput when user changes
  useEffect(() => {
    if (user?.email) {
      setEmailInput(user.email);
    }
  }, [user]);

  // Auto-verify if token is present in the URL on mount
  useEffect(() => {
    if (tokenFromUrl) {
      handleVerification(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleResendEmail = async () => {
    if (!isOnline) {
      toast.error("Network Offline", {
        description: "You must be online to request a verification email link.",
      });
      return;
    }

    const targetEmail = user?.email || emailInput;
    if (!targetEmail || !targetEmail.trim() || !targetEmail.includes("@")) {
      toast.error("Valid email address is required to resend verification link.");
      return;
    }

    setResendLoading(true);
    try {
      await identityApi.resendVerificationEmail(targetEmail.trim());
      toast.success("Verification Link Sent!", {
        description: `A new attestation signature link has been dispatched to ${targetEmail.trim()}.`,
      });
      setCountdown(60); // 60 seconds countdown
    } catch (err: any) {
      console.error("Resend failed:", err);
      toast.error("Failed to resend verification email", {
        description: err?.message || "Please check your network and try again.",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerification = async (verifyToken: string) => {
    if (!isOnline) {
      toast.error("Network Offline", {
        description: "Please check your internet connection before submitting verification.",
      });
      return;
    }

    if (!verifyToken.trim()) {
      toast.error("Please enter a valid verification token");
      return;
    }

    setStatus("verifying");
    setErrorMsg("");

    try {
      await identityApi.verifyEmail(verifyToken);
      setStatus("success");

      if (user) {
        dispatch(setAuthUser({
          ...user,
          emailVerified: true,
        }));

        const persisted = getPersistedUser();
        if (persisted) {
          setPersistedUser({
            ...persisted,
            emailVerified: true,
          }, true);
        }
      }

      toast.success("Identity Verified!", {
        description: "Your email has been successfully attested via API Gateway.",
      });
    } catch (err: any) {
      console.error("Verification failed:", err);
      setStatus("error");

      // Check if the verification token has expired
      const tokenExp = getJwtExpirationSeconds(verifyToken);
      const isExpired = 
        (tokenExp !== null && tokenExp <= 0) ||
        err?.message?.toLowerCase().includes("expired") || 
        err?.code === "INVALID_VERIFICATION_TOKEN" ||
        err?.statusCode === 401 ||
        verifyToken.toLowerCase().includes("expired"); // fallback for testing

      if (isExpired) {
        setErrorMsg("Your verification token has expired. We have automatically requested a new verification link for you.");
        toast.error("Verification Token Expired", {
          description: "Your verification link has expired. A new one is being automatically dispatched to your email.",
        });
        // Automatically trigger the resend flow
        await handleResendEmail();
      } else {
        setErrorMsg(err?.message || "Invalid or expired verification token. Please try again.");
        toast.error("Verification Failed", {
          description: err?.message || "Invalid or expired token.",
        });
      }
    }
  };

  const handleDevGetToken = async () => {
    if (!isOnline) {
      toast.error("Network Offline", {
        description: "You must be online to generate a sandbox verification token.",
      });
      return;
    }

    if (!emailInput.trim() || !emailInput.includes("@")) {
      toast.error("Please enter a valid email to get verification token");
      return;
    }

    setDevTokenLoading(true);
    try {
      const res = await identityApi.getVerificationToken(emailInput);
      setToken(res.token);
      toast.success("Dev Verification Token Retrieved!", {
        description: `Successfully simulated verification generation for ${emailInput}`,
      });
    } catch (err: any) {
      toast.error("Failed to fetch dev token", {
        description: err?.message || "Service error",
      });
    } finally {
      setDevTokenLoading(false);
    }
  };

  const handleSignOut = () => {
    dispatch(logoutUser());
    navigate("/login");
    toast.success("Signed out successfully");
  };

  return (
    <div className="min-h-screen ui-bg-landing flex items-center justify-center p-6 selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.05)_0%,transparent_65%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-950/70 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 overflow-hidden"
      >
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="mb-6 -mx-8 -mt-8 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 p-4 flex items-center gap-3 overflow-hidden"
              role="alert"
              aria-live="assertive"
            >
              <WifiOff size={16} className="text-amber-400 shrink-0 animate-pulse" />
              <div className="text-left">
                <p className="text-xs font-bold font-display">Connection Lost</p>
                <p className="text-[10px] text-amber-400/80 mt-0.5 leading-relaxed">
                  You are currently offline. Verification progress and countdowns have been paused.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            <motion.div 
              animate={{ 
                scale: [1, 1.08, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -inset-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur-lg"
            />
            <div className="relative w-16 h-16 bg-zinc-900 border border-white/10 rounded-2xl p-2.5 flex items-center justify-center">
              <img src={logo} alt="nxclip.ai" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white font-display">
            Attune Creator Account
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Attest your email address to unlock premium rendering pipelines and AI coaching.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {status === "verifying" && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="relative mb-6">
                <div className="h-14 w-14 rounded-full border-2 border-primary/20 flex items-center justify-center animate-pulse" />
                <Loader2 className="absolute top-4 left-4 h-6 w-6 text-primary animate-spin" />
              </div>
              <p className="text-sm font-medium text-white">Attuning security credentials...</p>
              <p className="text-xs text-muted-foreground mt-1.5 font-mono max-w-xs lowercase">
                submitting certificate signature to auth gateway...
              </p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-6 text-center"
            >
              <div className="h-14 w-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <CheckCircle2 size={28} />
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">Identity Attuned!</h3>
              <p className="text-xs text-muted-foreground mb-6 max-w-sm">
                Your email signature has been verified with the API Gateway. You now have full credentials on the platform.
              </p>

              <Button
                id="btn-goto-feed"
                onClick={() => navigate("/feed")}
                className="w-full bg-brand-gradient border-none py-6 font-semibold flex items-center justify-center gap-2 text-white hover:opacity-90"
              >
                Enter Creator Hub
                <ArrowRight size={16} />
              </Button>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex flex-col items-center text-center">
                <div className="h-14 w-14 bg-destructive/10 border border-destructive/20 text-destructive rounded-full flex items-center justify-center mb-4" aria-hidden="true">
                  <XCircle size={28} />
                </div>
                <h3 className="text-base font-bold text-white">Verification Failed</h3>
                <p id="verification-error-desc" className="text-xs text-destructive/80 mt-1 max-w-xs">{errorMsg}</p>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 mt-2">
                <label htmlFor="token-retry-input" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-2">
                  Try manually entering token
                </label>
                <div className="flex gap-2">
                  <input
                    id="token-retry-input"
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter verification token"
                    aria-label="Retry Verification Token"
                    aria-describedby="verification-error-desc"
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 font-mono"
                  />
                  <Button
                    id="btn-verify-retry"
                    size="sm"
                    onClick={() => handleVerification(token)}
                    disabled={!token.trim()}
                    className="text-xs px-4"
                    aria-label="Submit manual verification"
                  >
                    Verify
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setStatus("idle")}
                  className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5"
                >
                  Go Back
                </button>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}

          {status === "idle" && (
            <motion.div
              key={sessionExpired ? "expired" : "idle"}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-5"
            >
              {sessionExpired ? (
                <div className="space-y-6 py-4 text-center">
                  <div className="h-14 w-14 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Clock size={28} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white">Verification Session Expired</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      For your security, your email attestation session has timed out. Please refresh your session or sign in again to request a new link.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button
                      id="btn-refresh-session"
                      onClick={handleRefreshSession}
                      disabled={isRefreshingSession}
                      className="w-full py-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center justify-center gap-2 border-none"
                    >
                      {isRefreshingSession ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Renewing Session...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={12} />
                          Renew Secure Session
                        </>
                      )}
                    </Button>

                    <Button
                      id="btn-expired-login"
                      variant="outline"
                      onClick={handleSignOut}
                      className="w-full py-5 bg-transparent border-white/10 hover:bg-white/5 text-xs text-white"
                    >
                      Return to Sign In
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Active Session Expiry HUD */}
                  {sessionTimeRemaining !== null && (
                    <div 
                      className="bg-zinc-900/40 border border-white/5 rounded-xl p-3 flex flex-col gap-2.5"
                      role="region"
                      aria-label={`Secure session active. ${Math.floor(sessionTimeRemaining / 60)} minutes and ${(sessionTimeRemaining % 60).toString().padStart(2, "0")} seconds remaining.`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Secure Session Active
                        </span>
                        <span className="font-mono text-white/95 bg-white/5 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1 font-semibold" aria-hidden="true">
                          <Clock size={10} className="text-purple-400 animate-pulse" />
                          {Math.floor(sessionTimeRemaining / 60)}:{(sessionTimeRemaining % 60).toString().padStart(2, "0")}
                        </span>
                      </div>
                      
                      {/* Subtle Session Expiry Progress Bar */}
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden" aria-hidden="true">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000 ease-linear"
                          style={{ 
                            width: `${Math.min(100, (sessionTimeRemaining / 300) * 100)}%`,
                            backgroundColor: sessionTimeRemaining < 60 ? "#ef4444" : undefined
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="token-input" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
                        Verification Token
                      </label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} aria-hidden="true" />
                        <input
                          id="token-input"
                          type="text"
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          placeholder="Paste token or enter verification code"
                          aria-label="Verification Token Input"
                          className="w-full bg-zinc-900/40 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-xs text-white focus:outline-none focus:border-primary/50 font-mono"
                        />
                      </div>
                    </div>

                    <Button
                      id="btn-verify-token"
                      onClick={() => handleVerification(token)}
                      disabled={!token.trim()}
                      className="w-full py-6 bg-white hover:bg-white/90 text-black font-semibold flex items-center justify-center gap-2 border-none"
                      aria-label="Verify signature token"
                    >
                      Verify Signature
                      <Sparkles size={14} className="text-purple-600" aria-hidden="true" />
                    </Button>
                  </div>

                  {/* Resend Verification Email Block */}
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <p className="text-[10px] text-muted-foreground">
                        Didn't receive the email? We can dispatch another signature link to:
                      </p>
                      <p className="text-[11px] font-mono font-semibold text-white/90 bg-white/5 px-2.5 py-1 rounded-md border border-white/5 max-w-full truncate">
                        {user?.email || emailInput || "your email"}
                      </p>
                    </div>

                    <div className="relative w-full pb-1">
                      <Button
                        id="btn-resend-verification"
                        onClick={handleResendEmail}
                        disabled={resendLoading || countdown > 0}
                        variant="outline"
                        aria-label={countdown > 0 ? `Resend Verification Email cooldown active, wait ${countdown} seconds` : "Resend Verification Email"}
                        className="w-full py-5 bg-transparent border-white/10 hover:bg-white/5 text-xs text-white flex items-center justify-center gap-2 hover:border-white/20 transition-all relative overflow-hidden"
                      >
                        {/* Dynamic Background Progress Fill */}
                        {countdown > 0 && (
                          <div 
                            className="absolute inset-y-0 left-0 bg-purple-500/10 pointer-events-none transition-all duration-1000 ease-linear"
                            style={{ width: `${(countdown / 60) * 100}%` }}
                          />
                        )}

                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {resendLoading ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              Dispatching Link...
                            </>
                          ) : countdown > 0 ? (
                            <>
                              <Clock size={12} className="text-muted-foreground animate-pulse" />
                              Resend in {countdown}s
                            </>
                          ) : (
                            <>
                              <RefreshCw size={12} />
                              Resend Verification Email
                            </>
                          )}
                        </span>
                      </Button>

                      {/* Dynamic Progress Bar */}
                      {countdown > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 transition-all duration-1000 ease-linear"
                            style={{ width: `${(countdown / 60) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dev Only Sandbox Helper Box (Matches GET /auth/verification-token endpoint) */}
                  {(authProvider === "gateway" || authProvider === "mock") && (
                    <div 
                      className="mt-4 p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 relative overflow-hidden"
                      role="region"
                      aria-labelledby="dev-sandbox-header"
                    >
                      <div className="absolute top-0 right-0 p-1 bg-purple-500/10 text-purple-400 border-l border-b border-purple-500/20 text-[7px] uppercase font-bold tracking-widest rounded-bl-lg font-mono flex items-center gap-1" aria-hidden="true">
                        <Code size={8} />
                        Dev Only
                      </div>

                      <h4 id="dev-sandbox-header" className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                        Sandbox Assistant
                      </h4>
                      <p className="text-[9px] text-zinc-400 mt-1 mb-3">
                        In development mode, you can directly fetch the generated token for any registered email without checking a real inbox.
                      </p>

                      <div className="space-y-2">
                        <div className="relative">
                          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-purple-400/70" size={12} aria-hidden="true" />
                          <input
                            id="dev-email-input"
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="Enter your registered email"
                            aria-label="Sandbox Assistant registered email input"
                            className="w-full bg-black/40 border border-purple-500/20 rounded-lg pl-8 pr-4 py-1.5 text-[10px] text-white focus:outline-none focus:border-purple-500/50"
                          />
                        </div>

                        <button
                          id="btn-dev-get-token"
                          onClick={handleDevGetToken}
                          disabled={devTokenLoading || !emailInput.includes("@")}
                          className="w-full bg-purple-500/10 hover:bg-purple-500/20 active:bg-purple-500/30 border border-purple-500/30 text-purple-300 rounded-lg py-1.5 text-[9px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                          aria-label="Get verification token for sandbox email"
                        >
                          {devTokenLoading ? (
                            <>
                              <Loader2 size={10} className="animate-spin" />
                              Attaining token...
                            </>
                          ) : (
                            <>
                              <Globe size={10} />
                              GET /auth/verification-token
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleSignOut}
                      className="text-[11px] text-muted-foreground hover:text-rose-400 transition-colors"
                      aria-label="Sign out or switch creator account"
                    >
                      Sign Out / Switch Account
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Visually hidden aria-live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {srAnnouncement}
      </div>
    </div>
  );
}
