import { motion } from "motion/react";
import { TiktokIcon } from "../../components/TiktokIcon";
import { 
  Camera, 
  Edit3, 
  Heart, 
  TrendingUp, 
  Plus, 
  Sparkles,
  Zap,
  Lock,
  Loader2,
  Twitch,
  Youtube,
  Instagram,
  Twitter,
  Calendar,
  Clapperboard,
  ImageIcon,
  Laugh
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PhotoUploadDialog } from "../../components/PhotoUploadDialog";
import { CreatorAvatar } from "../../components/CreatorAvatar";
import { auth, db, handleFirestoreError, OperationType } from "../../firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { UserProfile } from "../../types";
import { Progress } from "../../components/ui/progress";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { Button, buttonVariants } from "../../components/ui/button";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import { cn } from "../../lib/utils";
import { useTranslation } from "react-i18next";

const statsDefinitions = [
  { key: "posts", value: "48" },
  { key: "followers", value: "12.4k" },
  { key: "following", value: "842" },
  { key: "engagement", value: "6.8%", isPro: true },
];

export default function OwnProfile() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [activeTab, setActiveTab] = useState("posts");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
      return;
    }

    const docRef = doc(db, "users", auth.currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching profile:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const games = profile?.games || profile?.gameNiches || [];

  const completion = useMemo(() => {
    if (!profile) return 0;
    let score = 0;
    const fields = [
      { key: 'displayName', weight: 20, check: () => !!profile.displayName && profile.displayName !== "Creator" },
      { key: 'bio', weight: 20, check: () => !!profile.bio && profile.bio.length > 10 },
      { key: 'games', weight: 20, check: () => games.length > 0 },
      { key: 'socials', weight: 20, check: () => !!profile.socials && Object.values(profile.socials).some(v => !!v) },
      { key: 'onboarding', weight: 20, check: () => !!profile.onboardingCompleted }
    ];
    
    fields.forEach(f => {
      if (f.check()) score += f.weight;
    });
    
    return score;
  }, [profile, games]);

  const handleUpdatePhoto = async (photoURL: string) => {
    if (!auth.currentUser) return;
    setIsUpdatingPhoto(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        photoURL,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to update photo:", err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  const missingFields = useMemo(() => {
    if (!profile) return [];
    const missing = [];
    if (!profile.displayName || profile.displayName === "Creator") missing.push(t('profile.missing_fields.display_name'));
    if (!profile.bio || profile.bio.length <= 10) missing.push(t('profile.missing_fields.bio'));
    if (games.length === 0) missing.push(t('profile.missing_fields.games'));
    if (!profile.socials || !Object.values(profile.socials).some(v => !!v)) missing.push(t('profile.missing_fields.socials'));
    if (!profile.onboardingCompleted) missing.push(t('profile.missing_fields.onboarding'));
    return missing;
  }, [profile, games, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Profile Completion Indicator */}
        {completion < 100 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ui-card p-6 border-primary/20 bg-primary/5 relative overflow-hidden group"
          >
            <div className={cn(
              "absolute top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity",
              isRtl ? "left-0" : "right-0"
            )}>
              <Sparkles size={48} className="text-primary" />
            </div>
            
            <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10", isRtl ? "text-right" : "text-left")}>
              <div className="space-y-3 flex-grow">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">{t('profile.complete_your_profile')}</h3>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">{t('profile.unlock_features')}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground">{t('profile.progress')}</span>
                    <span className="text-primary">{completion}%</span>
                  </div>
                  <Progress value={completion} className="h-1.5 bg-muted" />
                </div>

                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                  {t('profile.boost_visibility')} <span className="text-foreground font-bold">{missingFields.join(isRtl ? "، " : ", ")}</span>
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                <Link to="/profile/edit">
                  <Button variant="brand-gradient" size="sm" className="font-bold px-8 w-full shadow-lg shadow-primary/20">
                    {t('profile.finish_setup')}
                  </Button>
                </Link>
                <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-widest">{t('profile.takes_less_than')}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Profile Header Card */}
        <div className="ui-profile-header">
          {/* Cover Image */}
          <div className="ui-profile-cover relative group">
            <button className={cn(
              "absolute bottom-4 md:bottom-6 p-2 md:p-3 bg-popover/20 backdrop-blur-xl text-foreground rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-popover/30",
              isRtl ? "left-4 md:left-6" : "right-4 md:right-6"
            )}>
              <Camera size={20} />
            </button>
          </div>

          {/* Profile Info */}
          <div className="px-6 md:px-12 pb-8 md:pb-12 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
              <div className={cn("flex flex-col md:flex-row md:items-end gap-4 md:gap-6", isRtl ? "text-right" : "text-left")}>
                <div 
                  className="ui-profile-avatar-wrap -ml-0 md:-ml-0 group cursor-pointer relative shrink-0"
                  onClick={() => setIsPhotoDialogOpen(true)}
                >
                  <CreatorAvatar 
                    src={profile?.photoURL} 
                    email={auth.currentUser?.email} 
                    className={cn("ui-profile-avatar w-32 h-32 md:w-40 md:h-40", isUpdatingPhoto && "opacity-50")}
                    size="lg"
                  />
                  {isUpdatingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                  )}
                  <button className="absolute inset-0 bg-popover/40 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                    <Camera size={24} />
                  </button>
                </div>
                <div className="pb-1 md:pb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="ui-title">
                      {profile?.displayName || "Creator"}
                    </h2>
                    <Badge variant={profile?.plan === "free" ? "secondary" : "brand-gradient"} className="shadow-sm">
                      {profile?.plan === "pro" ? t('profile.plans.pro') : profile?.plan === "studio" ? t('profile.plans.studio') : t('profile.plans.free')}
                    </Badge>
                  </div>
                  <p className={cn("text-muted-foreground font-bold text-sm md:text-base", isRtl ? "text-right" : "text-left")}>@{profile?.email?.split('@')[0] || "creator"}</p>
                </div>
              </div>
              <div className="flex gap-3 pb-1 md:pb-2">
                <Link to="/profile/edit" className={cn(buttonVariants({ variant: "secondary" }), "gap-2")}>
                  <Edit3 size={18} />
                  {t('profile.edit_profile')}
                </Link>
                <Button size="icon-2xl" className="shadow-lg shadow-primary/20">
                  <Plus size={24} />
                </Button>
              </div>
            </div>

            {/* Social Links */}
            {profile?.socials && Object.values(profile.socials).some(v => !!v) && (
              <div className="flex flex-wrap gap-4 mt-6">
                {profile.socials.twitch && (
                  <a href={`https://twitch.tv/${profile.socials.twitch}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                    <Twitch size={14} />
                    {profile.socials.twitch}
                  </a>
                )}
                {profile.socials.youtube && (
                  <a href={`https://youtube.com/@${profile.socials.youtube}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                    <Youtube size={14} />
                    {profile.socials.youtube}
                  </a>
                )}
                {profile.socials.tiktok && (
                  <a href={`https://tiktok.com/@${profile.socials.tiktok}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-foreground hover:text-primary transition-colors">
                    <TiktokIcon size={14} />
                    {profile.socials.tiktok}
                  </a>
                )}
                {profile.socials.instagram && (
                  <a href={`https://instagram.com/${profile.socials.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                    <Instagram size={14} />
                    {profile.socials.instagram}
                  </a>
                )}
                {profile.socials.twitter && (
                  <a href={`https://twitter.com/${profile.socials.twitter}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                    <Twitter size={14} />
                    {profile.socials.twitter}
                  </a>
                )}
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {statsDefinitions.map((stat) => (
                <div key={stat.key} className={cn("ui-stat-card p-6 relative group overflow-hidden", isRtl ? "text-right" : "text-left")}>
                  {stat.isPro && profile?.plan === "free" && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-2">
                      <Lock size={14} className="text-primary mb-1" />
                      <p className="text-[8px] font-bold text-foreground uppercase tracking-widest">{t('profile.stats.pro_only')}</p>
                    </div>
                  )}
                  <p className="text-2xl font-display font-bold text-foreground mb-1">{stat.value}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t(`profile.stats.${stat.key}`)}</p>
                </div>
              ))}
            </div>

            {/* Bio & Niches */}
            <div className={cn("mt-10 space-y-6", isRtl ? "text-right" : "text-left")}>
              <p className="text-muted-foreground font-medium leading-relaxed max-w-2xl">
                {profile?.bio || t('profile.no_bio')}
              </p>
              <div className={cn("flex flex-wrap gap-2", isRtl && "flex-row-reverse justify-end")}>
                {games.map(game => (
                  <span key={game} className="ui-badge-secondary px-4 py-2">
                    {game}
                  </span>
                ))}
                {games.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">{t('profile.no_niches')}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <PhotoUploadDialog 
          isOpen={isPhotoDialogOpen}
          onClose={() => setIsPhotoDialogOpen(false)}
          onSelect={handleUpdatePhoto}
        />

        {/* Content Tabs */}
        <div className="space-y-8">
          <div className="flex items-center gap-8 border-b border-border px-6">
            {["posts", "plan", "liked", "saved"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`profile.tabs.${tab}`)}
                {activeTab === tab && (
                  <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {activeTab === "posts" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -4 }}
                  className="aspect-square ui-card overflow-hidden group cursor-pointer"
                >
                  <img src={`https://picsum.photos/seed/profile${i}/600/600`} className="w-full h-full object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-popover/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-6 text-foreground">
                    <div className="flex items-center gap-2">
                      <Heart size={20} fill="currentColor" />
                      <span className="font-bold">1.2k</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={20} />
                      <span className="font-bold">84%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "plan" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <Calendar className="text-primary" size={20} />
                  <h3 className="text-lg font-display font-bold">{t('profile.strategy.title')}</h3>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary font-bold">
                  {profile?.goal === "viral" ? t('profile.strategy.growth_mode') : t('profile.strategy.community_mode')}
                </Badge>
              </div>
              
              {profile?.contentPlan ? (
                <ScrollArea className="w-full whitespace-nowrap rounded-xl border border-border bg-card/30 p-4" dir={isRtl ? "rtl" : "ltr"}>
                  <div className="flex gap-4 pb-4">
                    {profile.contentPlan.map((day, i: number) => (
                      <Card key={i} className={cn("w-64 shrink-0 p-5 space-y-4 bg-card/50 border-border hover:border-primary/30 transition-colors", isRtl ? "text-right" : "text-left")}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{day.day}</span>
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold px-1.5 py-0">
                            {day.type}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-primary">
                            {day.type === "clip" ? <Clapperboard size={14} /> : day.type === "meme" ? <Laugh size={14} /> : <ImageIcon size={14} />}
                            <h4 className="text-sm font-bold truncate">{day.theme}</h4>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-normal line-clamp-2 italic">
                            "{day.tip}"
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              ) : (
                <div className="ui-card p-12 text-center space-y-4">
                  <Sparkles className="mx-auto text-muted-foreground/30" size={48} />
                  <p className="text-muted-foreground font-medium">{t('profile.strategy.no_plan')}</p>
                  <Link to="/onboarding">
                    <Button variant="outline" size="sm" className="font-bold">
                      {t('profile.strategy.start_onboarding')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {(activeTab === "liked" || activeTab === "saved") && (
            <div className="ui-card p-20 text-center text-muted-foreground font-medium">
              {t('common.no_data')}  {/* Using common key if available or just hardcode localized */}
            </div>
          )}
        </div>
      </div>
  );
}
