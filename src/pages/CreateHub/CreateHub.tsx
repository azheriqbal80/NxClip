import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { Sparkles, Video, Layout, ChevronRight, Lock, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { UserProfile } from "../../types";
import { searchGamingPhotos } from "../../services/pexelsService";
import { SEO } from "../../components/SEO";

const tools = [
  {
    title: "create.tools.image_studio.title",
    description: "create.tools.image_studio.description",
    icon: Sparkles,
    href: "/create/image",
    roleRequired: "user"
  },
  {
    title: "create.tools.clip_editor.title",
    description: "create.tools.clip_editor.description",
    icon: Video,
    href: "/create/clip",
    roleRequired: "creator"
  },
  {
    title: "create.tools.meme_gen.title",
    description: "create.tools.meme_gen.description",
    icon: Layout,
    href: "/create/image?type=meme",
    roleRequired: "user"
  }
];

interface CreationItem {
  id: string;
  title: string;
  type: string;
  image: string;
  photographer?: string;
  photographer_url?: string;
}

const initialCreations: CreationItem[] = [
  { id: "r1", title: "Elden Ring Boss", type: "clip", image: "https://picsum.photos/seed/eldenring/400/400" },
  { id: "r2", title: "Cyberpunk 2077 Night", type: "image", image: "https://picsum.photos/seed/cyberpunk2077/400/400" },
  { id: "r3", title: "Warzone Victory", type: "clip", image: "https://picsum.photos/seed/warzone/400/400" },
  { id: "r4", title: "Ghost of Tsushima", type: "image", image: "https://picsum.photos/seed/samurai/400/400" },
  { id: "r5", title: "God of War", type: "clip", image: "https://picsum.photos/seed/kratos/400/400" },
  { id: "r6", title: "Horizon Forbidden West", type: "image", image: "https://picsum.photos/seed/horizon/400/400" },
  { id: "r7", title: "Red Dead Redemption 2", type: "image", image: "https://picsum.photos/seed/rdr2/400/400" },
  { id: "r8", title: "The Last of Us Part II", type: "clip", image: "https://picsum.photos/seed/tlou2/400/400" },
];

export default function CreateHub() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentCreations, setRecentCreations] = useState(initialCreations);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadRecentCreations() {
      const photos = await searchGamingPhotos("gaming gameplay action", 8);
      if (photos.length > 0) {
        const updatedCreations = initialCreations.map((item, index) => {
          const photo = photos[index % photos.length];
          return {
            ...item,
            image: photo.src.large || photo.src.medium,
            photographer: photo.photographer,
            photographer_url: photo.photographer_url
          };
        });
        setRecentCreations(updatedCreations);
      }
    }
    loadRecentCreations();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const docRef = doc(db, "users", auth.currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    });
    return () => unsubscribe();
  }, []);

  const userRole: UserProfile["role"] = profile?.role || "user";
  const isAdmin = userRole === "admin";

  const hasAccess = (requiredRole: string) => {
    if (isAdmin) return true;
    if (requiredRole === "creator") return userRole === "creator";
    return true; // "user" role or default
  };

  return (
    <div className="w-full">
      <SEO 
        title={`${t('create.header.title')} | NexaClip.ai`}
        description={t('create.header.subtitle')}
      />
      <div className="mb-12">
        <h2 className="text-3xl font-display font-bold text-foreground mb-4">{t('create.header.plan')}</h2>
        <p className="text-muted-foreground font-medium">{t('create.header.plan_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <AnimatePresence mode="popLayout">
          {tools.map((tool, index) => {
            const locked = !hasAccess(tool.roleRequired);
            
            return (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={locked ? {} : { y: -8 }}
              >
                <Link to={locked ? "#" : tool.href} className={cn("block h-full", locked && "cursor-not-allowed")}>
                  <Card className={cn(
                    "h-full border-border bg-card hover:shadow-xl transition-all group relative overflow-hidden",
                    locked && "opacity-75 grayscale-[0.5]"
                  )}>
                    <CardContent className="p-6 md:p-8 flex flex-col h-full min-h-[280px]">
                      <div className="flex justify-between items-start mb-6 md:mb-8">
                        <div className={cn(
                          "w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                          "bg-primary/10 text-primary"
                        )}>
                          <tool.icon size={32} className="md:size-8" />
                        </div>
                        {tool.roleRequired === "creator" && (
                          <Badge variant={locked ? "destructive" : "secondary"} className="rounded-full text-[10px] font-bold tracking-widest px-3 py-1">
                            {locked ? <Lock size={12} className={cn(isAr ? "ml-1.5" : "mr-1.5")} /> : <Sparkles size={12} className={cn(isAr ? "ml-1.5" : "mr-1.5")} />}
                            {t('create.tools.creator_only')}
                          </Badge>
                        )}
                      </div>
                      
                        <div className="space-y-2 md:space-y-3 mb-6 md:mb-8 flex-grow">
                         <h3 className="text-xl md:text-2xl font-display font-bold text-foreground">
                            {t(tool.title)}
                         </h3>
                         <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                            {t(tool.description)}
                         </p>
                       </div>
                      
                      {locked ? (
                         <Button 
                          variant="brand-gradient" 
                          size="hero" 
                          className="w-full"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate("/pricing");
                          }}
                        >
                          <Lock size={18} className={isAr ? "ml-2" : "mr-2"} />
                          {t('create.tools.upgrade')}
                        </Button>
                      ) : (
                        <div className="flex items-center justify-between w-full pt-4 border-t border-border/50">
                          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {t('create.tools.get_started')}
                          </span>
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                            <ChevronRight size={20} className={cn("transition-transform", isAr ? "rotate-180 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5")} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                    
                    {locked && (
                      <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                        <div className="bg-card/80 backdrop-blur-md border border-border p-4 rounded-lg shadow-xl flex flex-col items-center gap-2">
                          <Lock size={24} className="text-muted-foreground" />
                          <span className="text-[10px] font-bold tracking-widest text-muted-foreground">{t('create.tools.locked')}</span>
                        </div>
                      </div>
                    )}
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Recent Creations Section */}
      <motion.div 
        id="recent-creations"
        className="mt-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="h-full border-border bg-card rounded-lg overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-foreground">{t('create.recent.title')}</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs font-bold text-muted-foreground hover:text-foreground" onClick={() => navigate("/library")}>
              {t('create.recent.view_all')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentCreations.map((item) => (
                <div key={item.id} className="group relative aspect-square bg-muted rounded-lg overflow-hidden border border-border cursor-pointer">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                    <div className="text-white text-[10px] font-bold tracking-widest bg-primary/80 px-2 py-1 rounded mb-2">
                      {t(`create.tabs.${item.type}`)}
                    </div>
                    <p className="text-white text-xs font-bold line-clamp-2">{item.title}</p>
                    
                    {item.photographer && (
                      <div className="mt-2">
                        <a 
                          href={item.photographer_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[8px] text-white/60 hover:text-white transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{t('create.recent.photo_by', { name: item.photographer })}</span>
                          <ExternalLink size={8} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
