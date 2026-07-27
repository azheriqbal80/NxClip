import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { Card } from "../../../components/ui/card";
import { cn } from "../../../lib/utils";

interface ContentTypePost {
  type: string;
  trend: string;
  published: string | number;
  engagement: string;
  platform: string;
  topPost: string;
  insight: string;
}

interface ContentTypeCardProps {
  post: ContentTypePost;
}

export const ContentTypeCard = memo(({ post }: ContentTypeCardProps) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  return (
    <Card className="ui-content-performance-card">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-display font-black text-foreground tracking-tight">{post.type}</h4>
        <span className={cn(
          "text-[10px] font-bold font-mono",
          post.trend.startsWith("+") ? "text-brand-secondary" : "text-destructive"
        )} dir="ltr">{post.trend}</span>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className={cn(
            "text-[9px] font-bold text-muted-foreground uppercase leading-none",
            isAr ? "tracking-normal" : "tracking-wider"
          )}>{t('dashboard.content_matrix.published')}</p>
          <p className="text-base font-display font-black" dir="ltr">{post.published}</p>
        </div>
        <div>
          <p className={cn(
            "text-[9px] font-bold text-muted-foreground uppercase leading-none",
            isAr ? "tracking-normal" : "tracking-wider"
          )}>{t('dashboard.content_matrix.eng_rate')}</p>
          <p className="text-base font-display font-black" dir="ltr">{post.engagement}</p>
        </div>
      </div>
      <div className="p-3 rounded-md bg-muted/30 border border-border mb-3">
          <p className={cn(
            "text-[9px] font-bold text-muted-foreground mb-1 uppercase leading-none",
            isAr ? "tracking-normal" : "tracking-wider"
          )}>{t('dashboard.content_matrix.top_post')}: {post.platform}</p>
          <p className="text-[11px] font-bold text-foreground line-clamp-1">{post.topPost}</p>
      </div>
      <div className="flex items-center gap-2">
         <Sparkles size={12} className={cn("text-amber-500 h-3 w-3 shrink-0")} />
         <p className="text-[10px] italic font-medium text-muted-foreground line-clamp-1 leading-normal">{post.insight}</p>
      </div>
    </Card>
  );
});

ContentTypeCard.displayName = "ContentTypeCard";
