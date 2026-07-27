import { useTranslation } from "react-i18next";
import { 
  User, 
  Bell, 
  CreditCard, 
  Shield, 
  Trash2, 
  ChevronRight, 
  RefreshCw,
  Sparkles,
  Zap,
  Cpu,
  SlidersHorizontal
} from "lucide-react";
import { useState, useEffect, memo, useCallback } from "react";
import { toast } from "sonner";
import { auth, db, handleFirestoreError, OperationType } from "../../firebase";
import { doc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "../../types";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { FormField } from "../../components/ui/form-field";
import { Skeleton } from "../../components/ui/skeleton";
import { cn } from "../../lib/utils";
import { safeLocalStorage } from "../../lib/safeStorage";
import { PwaInstallPrompt } from "../../components/PwaInstallPrompt";
import { ApiSettings } from "../../components/Settings/ApiSettings";

const SettingsSkeleton = memo(() => (
  <div className="space-y-10 animate-in fade-in duration-500">
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-sm" />
    </div>
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
    <div className="pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-4">
      <Skeleton className="h-14 w-40 rounded-md" />
      <Skeleton className="h-14 w-48 rounded-md" />
      <Skeleton className="h-14 w-40 rounded-md ml-auto" />
    </div>
  </div>
));

SettingsSkeleton.displayName = "SettingsSkeleton";

const BillingSkeleton = memo(() => (
  <div className="space-y-10 animate-in fade-in duration-500">
    <div className="space-y-3">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
    <Skeleton className="h-48 w-full rounded-lg" />
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  </div>
));

BillingSkeleton.displayName = "BillingSkeleton";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState("account");

  const sections = [
    { id: "account", label: t('settings.sections.account'), icon: User },
    { id: "notifications", label: t('settings.sections.notifications'), icon: Bell },
    { id: "billing", label: t('settings.sections.billing'), icon: CreditCard },
    { id: "privacy", label: t('settings.sections.privacy'), icon: Shield },
    { id: "api", label: "API Settings", icon: SlidersHorizontal },
    { id: "developer", label: "Developer Settings", icon: Cpu },
    { id: "danger", label: t('settings.sections.danger'), icon: Trash2, color: "text-destructive" },
  ];
  const [resetting, setResetting] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Controlled fields for Account Profile
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }
    const docRef = doc(db, "users", auth.currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        // Only set if not currently editing or first load
        setDisplayName(prev => prev || data.displayName || "");
        setEmail(prev => prev || data.email || "");
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Firebase Snapshot Error:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveAccount = useCallback(async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(docRef, {
        displayName,
        email,
        updatedAt: serverTimestamp()
      });
      toast.success(t('settings.account.saved_success'));
    } catch (err) {
      console.error("Failed to save settings:", err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setIsSaving(false);
    }
  }, [displayName, email]);

  const handleResetOnboarding = useCallback(async () => {
    if (!auth.currentUser) return;
    setResetting(true);
    try {
      const docRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(docRef, { 
        onboardingCompleted: false,
        updatedAt: serverTimestamp()
      });
      navigate("/onboarding", { state: { fromReset: true } });
    } catch (err) {
      console.error("Failed to reset onboarding:", err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setResetting(false);
    }
  }, [navigate]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full lg:w-72">
        <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 px-6 py-4 rounded-md font-bold text-sm transition-all whitespace-nowrap shrink-0 lg:shrink ${
                activeSection === section.id 
                  ? "bg-card border border-border text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <section.icon size={18} className={section.color || ""} />
              {section.label}
              {activeSection === section.id && <ChevronRight size={16} className="ml-auto rtl:mr-auto rtl:ml-0 text-primary hidden lg:block rtl:rotate-180" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow bg-card rounded-lg border border-border p-8 md:p-12 shadow-sm min-h-[500px]">
        {isLoading ? (
          activeSection === "billing" ? <BillingSkeleton /> : <SettingsSkeleton />
        ) : (
          <>
            {activeSection === "account" && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div>
                  <h3 className="text-2xl font-display font-bold text-foreground mb-2">{t('settings.account.title')}</h3>
                  <p className="text-muted-foreground font-medium">{t('settings.account.subtitle')}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <FormField
                    label={t('settings.account.display_name')}
                    id="displayName"
                    description={t('settings.account.display_name_desc')}
                  >
                    <Input 
                      id="displayName"
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-14 px-6 py-4 bg-muted/20 border-border/50 rounded-xl focus:bg-background transition-all text-foreground font-bold"
                      disabled={isSaving}
                    />
                  </FormField>
                  <FormField
                    label={t('settings.account.email')}
                    id="email"
                    description={t('settings.account.email_desc')}
                  >
                    <Input 
                      id="email"
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 px-6 py-4 bg-muted/20 border-border/50 rounded-xl focus:bg-background transition-all text-foreground font-bold"
                      disabled={isSaving}
                    />
                  </FormField>
                </div>

                <div className="pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-4">
                  <button 
                    onClick={handleResetOnboarding}
                    disabled={resetting || isSaving}
                    className="px-6 py-4 bg-muted text-muted-foreground rounded-md font-bold hover:bg-muted/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={18} className={resetting ? "animate-spin" : ""} />
                    {t('settings.account.reset_onboarding')}
                  </button>
                  <button 
                    onClick={() => {
                      safeLocalStorage.removeItem("nxclip-tour-seen");
                      navigate("/dashboard");
                    }}
                    className="px-8 py-4 bg-muted text-muted-foreground rounded-md font-bold hover:bg-muted/80 transition-all flex items-center justify-center gap-2"
                    disabled={isSaving}
                  >
                    <Sparkles size={18} className="text-primary" />
                    {t('settings.account.restart_guide')}
                  </button>
                  <button 
                    onClick={handleSaveAccount}
                    disabled={isSaving}
                    className="px-8 py-4 bg-primary text-primary-foreground rounded-md font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {isSaving ? t('settings.account.saving') : t('settings.account.save_changes')}
                  </button>
                </div>

                <PwaInstallPrompt variant="banner" className="pt-8 border-t border-border" />
              </div>
            )}

            {activeSection === "billing" && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div>
                  <h3 className="text-2xl font-display font-bold text-foreground mb-2">{t('settings.billing.title')}</h3>
                  <p className="text-muted-foreground font-medium">{t('settings.billing.subtitle')}</p>
                </div>

                <div className="p-8 bg-card border border-border rounded-lg shadow-sm relative overflow-hidden group">
                  <div className={cn("absolute top-0 opacity-5 group-hover:opacity-10 transition-opacity p-6", i18n.language === 'ar' ? "left-0" : "right-0")}>
                    {profile?.plan === "free" ? <CreditCard size={120} /> : <Sparkles size={120} className="text-primary" />}
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Badge variant={profile?.plan === "free" ? "secondary" : "brand-gradient"} className="px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none">
                          {profile?.plan === "pro" ? t('settings.billing.plans.pro') : profile?.plan === "studio" ? t('settings.billing.plans.studio') : t('settings.billing.plans.free')}
                        </Badge>
                        <span className="text-sm font-bold text-foreground font-mono">
                          {profile?.plan === "pro" ? t('settings.billing.pricing.pro') : profile?.plan === "studio" ? t('settings.billing.pricing.studio') : t('settings.billing.pricing.free')}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-foreground leading-none">
                          {profile?.plan === "free" ? t('settings.billing.plans.limited') : t('settings.billing.plans.professional')}
                        </h4>
                        <p className="text-sm text-muted-foreground font-medium">
                          {profile?.plan === "free" 
                            ? t('settings.billing.plans.limited_desc') 
                            : t('settings.billing.plans.professional_desc')}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 pt-2">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('settings.billing.status.label')}</p>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                            <div className={cn("w-2 h-2 rounded-full", profile?.plan === "free" ? "bg-muted" : "bg-primary animate-pulse")} />
                            {profile?.plan === "free" ? t('settings.billing.status.active_basic') : t('settings.billing.status.active_premium')}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('settings.billing.next_billing')}</p>
                          <p className="text-xs font-bold text-foreground">
                            {profile?.plan === "free" ? t('settings.billing.na') : t('common.date_format', { month: t('common.months.may'), day: 20, year: 2026 })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      {profile?.plan === "free" ? (
                        <button 
                          onClick={() => navigate("/upgrade")}
                          className="px-8 py-3 bg-primary text-primary-foreground rounded-md font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                          <Zap size={16} fill="currentColor" />
                          {t('settings.billing.upgrade')}
                        </button>
                      ) : (
                        <button className="px-8 py-3 bg-muted text-foreground rounded-md font-bold border border-border hover:bg-muted/80 transition-all">
                          {t('settings.billing.cancel')}
                        </button>
                      )}
                      <button className="text-[11px] font-bold text-muted-foreground hover:text-foreground underline transition-colors text-center">
                        {t('settings.billing.payment_methods')}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">{t('settings.billing.history')}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('settings.billing.last_12_months')}</p>
                  </div>
                  
                  {profile?.plan === "free" ? (
                    <div className="py-12 text-center bg-muted/20 rounded-xl border border-dashed border-border">
                      <p className="text-sm font-medium text-muted-foreground italic">{t('settings.billing.empty_history')}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card">
                      {[1, 2].map(i => (
                        <div key={i} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-all">
                          <div className="flex items-center gap-5">
                            <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground ring-1 ring-border">
                              <CreditCard size={18} />
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-foreground leading-none mb-1">{t('settings.billing.invoice_label', { id: i })}</p>
                              <p className="text-[11px] text-muted-foreground font-medium">{t('common.date_format', { month: t('common.months.april'), day: 20 - i, year: 2026 })}</p>
                            </div>
                          </div>
                          <div className="text-right rtl:text-left">
                            <p className="text-[13px] font-display font-bold text-foreground tracking-tight leading-none mb-1">{t('common.currency', { amount: "12.00" })}</p>
                            <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">{t('settings.billing.download_pdf')}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === "api" && (
              <ApiSettings />
            )}

            {activeSection === "developer" && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                <div>
                  <h3 className="text-2xl font-display font-bold text-foreground mb-2">Developer Settings</h3>
                  <p className="text-muted-foreground font-sans text-sm">Advanced system, cluster networking, and showroom styling configuration settings.</p>
                </div>

                <div className="p-8 bg-zinc-900/40 border-white/5 rounded-2xl space-y-6 flex flex-col items-center text-center max-w-2xl mx-auto">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-purple-600/20 rounded-full blur-xl" />
                    <div className="relative w-16 h-16 bg-zinc-950 border border-white/10 rounded-2xl flex items-center justify-center text-purple-400">
                      <Cpu size={28} className="animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-white font-sans">Developer Console Consolidated</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed font-sans max-w-md">
                      Developer preferences, backend environment clusters, intercept configurations, and tokens showrooms have been migrated to the new, full-screen **Developer Suite Workspace**.
                    </p>
                  </div>

                  <button
                    onClick={() => navigate("/admin/dev-suite")}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold tracking-wider uppercase px-6 py-3 rounded-xl shadow-lg shadow-purple-500/20 text-xs transition-all duration-200 outline-none"
                  >
                    Open Developer Suite Console
                  </button>
                </div>
              </div>
            )}

            {activeSection === "danger" && (
              <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-500">
                <div>
                  <h3 className="text-2xl font-display font-bold text-destructive mb-2">{t('settings.danger.title')}</h3>
                  <p className="text-muted-foreground font-medium">{t('settings.danger.subtitle')}</p>
                </div>

                <div className="p-8 border-2 border-dashed border-destructive/10 rounded-lg bg-destructive/5">
                  <h4 className="text-lg font-bold text-foreground mb-2">{t('settings.danger.delete_title')}</h4>
                  <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                    {t('settings.danger.delete_desc')}
                  </p>
                  <button className="px-8 py-4 bg-destructive text-primary-foreground rounded-md font-bold shadow-lg shadow-destructive/20 hover:bg-destructive/90 transition-all flex items-center gap-2">
                    <Trash2 size={18} />
                    {t('settings.danger.delete_button')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
