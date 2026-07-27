import { motion, AnimatePresence } from "motion/react";
import { Camera, ChevronLeft, Save, X, Plus, Loader2, Check, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db, handleFirestoreError, OperationType, isFirebaseConfigured } from "../../firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { UserProfile } from "../../types";
import { toast } from "sonner";
import { safeLocalStorage } from "../../lib/safeStorage";
import { useAppDispatch } from "../../store/hooks";
import { setAuthProfile } from "../../store/slices/authSlice";

import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { FormField } from "../../components/ui/form-field";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { PhotoUploadDialog } from "../../components/PhotoUploadDialog";
import { CreatorAvatar } from "../../components/CreatorAvatar";
import { cn } from "../../lib/utils";

const POPULAR_GAMES = [
  "Valorant", "Minecraft", "Fortnite", "League of Legends", 
  "Warzone", "Apex Legends", "GTA V", "Overwatch 2", 
  "Roblox", "CS2", "Rocket League", "Elden Ring"
];

const socialUrlSchema = z.string().trim().refine((val) => {
  if (!val) return true;
  try {
    const url = new URL(val.startsWith('http') ? val : `https://${val}`);
    return url.hostname.length > 3;
  } catch {
    return false;
  }
}, {
  message: "Invalid URL format"
});

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name must be under 50 characters"),
  bio: z.string().max(200, "Bio cannot exceed 200 characters"),
  socials: z.object({
    twitch: socialUrlSchema,
    youtube: socialUrlSchema,
    instagram: socialUrlSchema,
    twitter: socialUrlSchema,
    tiktok: socialUrlSchema,
  }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [gameNiches, setGameNiches] = useState<string[]>([]);
  const [nicheInput, setNicheInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [photoURL, setPhotoURL] = useState("");
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      socials: {
        twitch: "",
        youtube: "",
        instagram: "",
        twitter: "",
        tiktok: "",
      }
    }
  });

  const dispatch = useAppDispatch();
  const bioValue = watch("bio") || "";

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
      return;
    }

    if (!isFirebaseConfigured) {
      const activeUser = auth.currentUser;
      const key = `nx_mock_profile_${activeUser.uid}`;
      const savedMock = safeLocalStorage.getItem(key);
      let data: any = null;
      if (savedMock) {
        try {
          data = JSON.parse(savedMock);
        } catch (_) {}
      }

      reset({
        displayName: data?.displayName || activeUser.displayName || "Creator",
        bio: data?.bio || "",
        socials: {
          twitch: data?.socials?.twitch || "",
          youtube: data?.socials?.youtube || "",
          instagram: data?.socials?.instagram || "",
          twitter: data?.socials?.twitter || "",
          tiktok: data?.socials?.tiktok || ""
        }
      });
      setGameNiches(data?.gameNiches || data?.games || ["Valorant"]);
      setPhotoURL(data?.photoURL || activeUser.photoURL || "");
      setFetching(false);
      return;
    }

    const docRef = doc(db, "users", auth.currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        
        // Reset RHF values with actual data from snapshot
        reset({
          displayName: data.displayName || "",
          bio: data.bio || "",
          socials: {
            twitch: data.socials?.twitch || "",
            youtube: data.socials?.youtube || "",
            instagram: data.socials?.instagram || "",
            twitter: data.socials?.twitter || "",
            tiktok: data.socials?.tiktok || ""
          }
        });
        
        setGameNiches(data.gameNiches || data.games || []);
        setPhotoURL(data.photoURL || "");
      }
      setFetching(false);
    }, (err) => {
      console.error("Error fetching profile:", err);
      setFetching(false);
    });

    return () => unsubscribe();
  }, [navigate, reset]);

  const toggleNiche = (niche: string) => {
    if (gameNiches.includes(niche)) {
      setGameNiches(gameNiches.filter(n => n !== niche));
    } else {
      setGameNiches([...gameNiches, niche]);
    }
  };

  const handleAddNiches = () => {
    if (!nicheInput.trim()) return;
    
    const newNiches = nicheInput
      .split(',')
      .map(n => n.trim())
      .filter(n => n !== "" && !gameNiches.includes(n));
    
    if (newNiches.length > 0) {
      setGameNiches([...gameNiches, ...newNiches]);
    }
    setNicheInput("");
  };

  const handleSave = async (data: ProfileFormData) => {
    if (!auth.currentUser) return;
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      if (isFirebaseConfigured) {
        const docRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(docRef, {
          displayName: data.displayName,
          bio: data.bio,
          gameNiches,
          games: gameNiches, // Sync for backward compatibility
          socials: data.socials,
          photoURL,
          updatedAt: serverTimestamp()
        });
      } else {
        const activeUser = auth.currentUser;
        const key = `nx_mock_profile_${activeUser.uid}`;
        const mockProfileData = {
          displayName: data.displayName,
          bio: data.bio,
          gameNiches,
          games: gameNiches,
          socials: data.socials,
          photoURL,
          updatedAt: new Date().toISOString()
        };
        safeLocalStorage.setItem(key, JSON.stringify(mockProfileData));
        
        // Also update redux profile
        dispatch(setAuthProfile({
          uid: activeUser.uid,
          displayName: data.displayName,
          email: activeUser.email,
          photoURL: photoURL || null,
          plan: "pro",
          role: "creator",
          onboardingCompleted: true,
          createdAt: new Date().toISOString()
        }));
      }
      setLoading(false);
      setSuccess(true);
      toast.success(t('profile.edit.toast.success_title'), {
        description: t('profile.edit.toast.success_desc')
      });
      
      // Navigate after a brief success message
      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (err) {
      setLoading(false);
      setSuccess(false);
      setError(t('profile.edit.toast.generic_error'));
      toast.error(t('profile.edit.toast.error_title'), {
        description: t('profile.edit.toast.error_desc')
      });
      try {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      } catch {
        // handleFirestoreError throws
      }
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex items-center gap-4 mb-10">
          <Link to="/profile" className={cn(
            "p-2 hover:bg-accent rounded-md transition-all text-muted-foreground hover:text-foreground",
            isRtl && "rotate-180"
          )}>
            <ChevronLeft size={24} />
          </Link>
          <h2 className="text-2xl font-display font-bold text-foreground">{t('profile.edit.title')}</h2>
        </div>

        <div className="bg-card rounded-lg border border-border p-8 md:p-12 shadow-sm space-y-10">
          {/* Avatar Edit */}
          <div className="flex flex-col items-center gap-6">
            <div 
              className="w-32 h-32 relative group cursor-pointer"
              onClick={() => setIsPhotoDialogOpen(true)}
            >
              <CreatorAvatar 
                src={photoURL} 
                email={auth.currentUser?.email} 
                className="w-32 h-32"
                size="lg"
              />
              <div className="absolute inset-0 bg-background/40 flex flex-col items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px] rounded-full">
                <Camera size={24} className="mb-1" />
                <span className="text-[10px] font-bold tracking-widest">{t('profile.edit.change_photo')}</span>
              </div>
            </div>
            <p className="text-xs font-bold text-muted-foreground tracking-widest">{t('profile.edit.photo_label')}</p>
          </div>

          <PhotoUploadDialog 
            isOpen={isPhotoDialogOpen} 
            onClose={() => setIsPhotoDialogOpen(false)} 
            onSelect={(url) => setPhotoURL(url)} 
          />

          {/* Form */}
          <form id="edit-profile-form" onSubmit={handleSubmit(handleSave)} className="space-y-8">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-4"
                >
                  <Alert variant="destructive">
                    <AlertCircle className={cn("h-4 w-4", isRtl && "ml-2")} />
                    <AlertTitle>{t('profile.edit.error_title')}</AlertTitle>
                    <AlertDescription tabIndex={0}>
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-4"
                >
                  <Alert variant="premium">
                    <Check className={cn("h-4 w-4", isRtl && "ml-2")} />
                    <AlertTitle>{t('profile.edit.success_title')}</AlertTitle>
                    <AlertDescription tabIndex={0}>
                      {t('profile.edit.success_msg')}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <FormField
              label={t('profile.edit.display_name_label')}
              id="displayName"
              description={t('profile.edit.display_name_desc')}
              disabled={loading || success}
              className={isRtl ? "text-right" : "text-left"}
              error={errors.displayName?.message}
            >
              <Input 
                id="displayName"
                type="text" 
                {...register("displayName")}
                className={cn(
                  "h-14 px-6 py-4 bg-muted/20 border-border/50 rounded-xl focus:bg-background transition-all text-foreground font-bold",
                  isRtl && "text-right"
                )}
                placeholder={t('profile.edit.display_name_placeholder')}
                disabled={loading || success}
              />
            </FormField>

            <FormField
              label={t('profile.edit.bio_label')}
              id="bio"
              description={t('profile.edit.bio_desc')}
              disabled={loading || success}
              className={isRtl ? "text-right" : "text-left"}
              error={errors.bio?.message}
            >
              <Textarea 
                id="bio"
                {...register("bio")}
                className={cn(
                  "w-full px-6 py-4 bg-muted/20 border-border/50 rounded-xl focus:bg-background transition-all text-foreground font-medium min-h-[140px] resize-none",
                  isRtl && "text-right"
                )}
                placeholder={t('profile.edit.bio_placeholder')}
                maxLength={200}
                disabled={loading || success}
              />
              <div className={cn("flex mt-2", isRtl ? "justify-start" : "justify-end")}>
                <span className={cn(
                  "text-[10px] font-bold tracking-widest transition-all duration-300 px-2 py-1 rounded-md",
                  bioValue.length >= 200 ? "bg-destructive/10 text-destructive animate-pulse" : 
                  bioValue.length >= 160 ? "bg-amber-500/10 text-amber-500" : 
                  "bg-muted/50 text-muted-foreground"
                )}>
                  {bioValue.length} / 200
                </span>
              </div>
            </FormField>

            <div className="space-y-4">
              <div className={cn("px-1", isRtl ? "text-right" : "text-left")}>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{t('profile.edit.social_links_label')}</label>
                <p className="text-[10px] text-muted-foreground/60 font-medium mt-1">{t('profile.edit.social_links_desc')}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir={isRtl ? "rtl" : "ltr"}>
                <FormField error={errors.socials?.twitch?.message}>
                  <Input 
                    placeholder={t('profile.edit.twitch_placeholder')} 
                    {...register("socials.twitch")}
                    className={cn("bg-muted/20 border-border/50 h-12", isRtl && "text-right")}
                    disabled={loading || success}
                  />
                </FormField>
                <FormField error={errors.socials?.youtube?.message}>
                  <Input 
                    placeholder={t('profile.edit.youtube_placeholder')} 
                    {...register("socials.youtube")}
                    className={cn("bg-muted/20 border-border/50 h-12", isRtl && "text-right")}
                    disabled={loading || success}
                  />
                </FormField>
                <FormField error={errors.socials?.instagram?.message}>
                  <Input 
                    placeholder={t('profile.edit.instagram_placeholder')} 
                    {...register("socials.instagram")}
                    className={cn("bg-muted/20 border-border/50 h-12", isRtl && "text-right")}
                    disabled={loading || success}
                  />
                </FormField>
                <FormField error={errors.socials?.twitter?.message}>
                  <Input 
                    placeholder={t('profile.edit.twitter_placeholder')} 
                    {...register("socials.twitter")}
                    className={cn("bg-muted/20 border-border/50 h-12", isRtl && "text-right")}
                    disabled={loading || success}
                  />
                </FormField>
                <FormField error={errors.socials?.tiktok?.message}>
                  <Input 
                    placeholder={t('profile.edit.tiktok_placeholder')} 
                    {...register("socials.tiktok")}
                    className={cn("bg-muted/20 border-border/50 h-12", isRtl && "text-right")}
                    disabled={loading || success}
                  />
                </FormField>
              </div>
            </div>

            <div className="space-y-4">
              <div className={cn("px-1", isRtl ? "text-right" : "text-left")}>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{t('profile.edit.games_label')}</label>
                <p className="text-[10px] text-muted-foreground/60 font-medium mt-1">{t('profile.edit.games_desc')}</p>
              </div>
              
              <div className={cn("flex flex-wrap gap-2 min-h-[50px] p-4 bg-muted/10 border border-border/50 rounded-xl", isRtl && "flex-row-reverse")}>
                {gameNiches.length === 0 && (
                  <span className="text-xs text-muted-foreground italic ms-1">{t('profile.edit.no_niches')}</span>
                )}
                <AnimatePresence>
                  {gameNiches.map(niche => (
                    <motion.div
                      key={niche}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "h-8 px-3 py-0 gap-2 bg-primary/10 text-primary border-primary/20 rounded-md font-bold text-[11px]",
                          isRtl && "flex-row-reverse"
                        )}
                      >
                        {niche}
                        <button 
                          onClick={() => toggleNiche(niche)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="space-y-3">
                <div className={cn("flex gap-2", isRtl && "flex-row-reverse text-right")}>
                  <Input 
                    type="text" 
                    placeholder={t('profile.edit.custom_niche_placeholder')}
                    value={nicheInput}
                    onChange={(e) => setNicheInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNiches();
                      }
                    }}
                    className={cn(
                      "h-12 px-4 bg-muted/30 border-border rounded-lg focus:bg-background transition-all text-foreground font-medium",
                      isRtl && "text-right"
                    )}
                  />
                  <Button 
                    type="button"
                    onClick={handleAddNiches}
                    variant="outline"
                    className="h-12 w-12 p-0 border-border hover:bg-primary hover:text-white transition-all shrink-0"
                  >
                    <Plus size={20} />
                  </Button>
                </div>
                
                <div className={cn("space-y-2", isRtl ? "text-right" : "text-left")}>
                  <p className="text-[10px] text-muted-foreground ms-1 font-bold tracking-widest uppercase">{t('profile.edit.popular_suggestions')}</p>
                  <div className={cn("flex flex-wrap gap-1.5", isRtl && "flex-row-reverse")}>
                    {POPULAR_GAMES.map(game => {
                      const isSelected = gameNiches.includes(game);
                      return (
                        <button
                          key={game}
                          type="button"
                          onClick={() => toggleNiche(game)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border",
                            isSelected 
                              ? "bg-primary border-primary text-white" 
                              : "bg-muted/30 border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                          )}
                        >
                          {isSelected && <Check size={10} className={cn("inline", isRtl ? "ml-1" : "mr-1")} />}
                          {game}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </form>

          <div className={cn("pt-6 border-t border-border flex gap-3", isRtl && "flex-row-reverse")}>
            <Button 
              variant="outline"
              onClick={() => navigate("/profile")}
              className="flex-grow h-14 font-bold"
              disabled={loading || success}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit"
              form="edit-profile-form"
              disabled={loading || success}
              className={cn(
                "flex-grow h-14 font-bold transition-all duration-300",
                success ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20" : "shadow-lg shadow-primary/20"
              )}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Loader2 className="animate-spin" size={18} />
                  </motion.div>
                ) : success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}
                  >
                    <Check size={18} />
                    {t('profile.edit.saved_btn')}
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}
                  >
                    <Save size={18} />
                    {t('profile.edit.save_btn')}
                  </motion.div>
                ) }
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </div>
  );
}

