import { motion } from "motion/react";
import { 
  Heart, 
  TrendingUp, 
  ChevronLeft,
  ChevronRight,
  UserPlus,
  MessageCircle,
  Play
} from "lucide-react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [isFollowing, setIsFollowing] = useState(false);

  const statsDefinitions = [
    { key: "posts", value: t('profile.demo_stats.posts') },
    { key: "followers", value: t('profile.demo_stats.followers') },
    { key: "following", value: t('profile.demo_stats.following') },
  ];

  return (
    <div className="space-y-8">
        <Button 
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2 mb-4"
        >
          {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {t('common.back')}
        </Button>

        <div className="ui-profile-header">
          <div className="ui-profile-cover" />
          <div className="px-6 md:px-12 pb-12 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="flex flex-col md:flex-row md:items-end gap-6 text-start">
                <div className="ui-profile-avatar-wrap -ml-0 md:-ml-0">
                  <div className="ui-profile-avatar">
                    <img src={`https://picsum.photos/seed/user${id}/200/200`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
                <div className="pb-2">
                  <h2 className="ui-title mb-1">EliteGamer_{id}</h2>
                  <p className="text-muted-foreground font-bold rtl:text-end">@elite_gamer_official</p>
                </div>
              </div>
              <div className="flex gap-3 pb-2">
                <Button 
                  onClick={() => setIsFollowing(!isFollowing)}
                  variant={isFollowing ? "secondary" : "default"}
                  size="2xl"
                  className="px-8"
                >
                  {isFollowing ? t('profile.actions.following') : (
                    <>
                      <UserPlus size={18} className={cn(isRtl ? "ml-2" : "mr-2")} />
                      {t('profile.actions.follow')}
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="icon-2xl" className="border border-border">
                  <MessageCircle size={24} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-12 max-w-md">
              {statsDefinitions.map((stat) => (
                <div key={stat.key} className="ui-stat-card p-6 text-start">
                  <p className="text-2xl font-display font-bold text-foreground mb-1">{stat.value}</p>
                  <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase rtl:tracking-normal rtl:normal-case">{t(`profile.stats.${stat.key}`)}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-start">
              <p className="text-muted-foreground font-medium leading-relaxed max-w-2xl">
                {t('profile.user_bio')}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-bold text-foreground">{t('profile.actions.recent_creations')}</h3>
            <button className="text-xs font-bold text-primary tracking-widest hover:opacity-80 transition-opacity">
              {t('profile.actions.view_all')}
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="group relative aspect-square ui-card overflow-hidden cursor-pointer rounded-xl border-border/40"
              >
                <img 
                  src={`https://picsum.photos/seed/userpost${i}/600/600`} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  referrerPolicy="no-referrer" 
                />
                
                {/* Visual Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Heart size={14} className="fill-white" />
                        <span className="text-xs font-bold">1.2k</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle size={14} className="fill-white" />
                        <span className="text-xs font-bold">48</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-popover/20 backdrop-blur-xl flex items-center justify-center">
                      <Play size={14} className="fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Always visible indicator (e.g. video icon if it's a clip) */}
                <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-popover/40 backdrop-blur-md border border-border text-foreground opacity-100 group-hover:opacity-0 transition-opacity">
                   <TrendingUp size={12} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
  );
}
