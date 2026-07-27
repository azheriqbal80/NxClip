import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Zap, MoreHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { CONTENT_DATA } from "../constants";
import { AnalyticsContentSkeleton } from "../../skeletons/AnalyticsSkeleton";

interface ContentTabProps {
  isLoading: boolean;
  contentType: string;
}

export const ContentTab = memo(({ isLoading, contentType }: ContentTabProps) => {
  const { t, i18n } = useTranslation();

  const filteredData = CONTENT_DATA.filter((item) => {
    if (contentType === "all") return true;
    return item.type.toLowerCase() === contentType.toLowerCase();
  });

  if (isLoading) {
    return <AnalyticsContentSkeleton />;
  }

  return (
    <div className="ui-table-container overflow-x-auto no-scrollbar">
      <Table className="ui-table-shell min-w-[700px] lg:min-w-0 font-sans">
        <TableHeader className="ui-table-header">
          <TableRow className="ui-table-row">
            <TableHead className="uppercase text-[9px] tracking-wider font-bold text-muted-foreground">{t('analytics.table.item')}</TableHead>
            <TableHead className="hidden md:table-cell uppercase text-[9px] tracking-wider font-bold text-muted-foreground">{t('analytics.table.game')}</TableHead>
            <TableHead className="uppercase text-[9px] tracking-wider font-bold text-muted-foreground">{t('analytics.table.type')}</TableHead>
            <TableHead className="text-end uppercase text-[9px] tracking-wider font-bold text-muted-foreground">{t('analytics.table.views')}</TableHead>
            <TableHead className="text-end uppercase text-[9px] tracking-wider font-bold text-muted-foreground">{t('analytics.table.engagement')}</TableHead>
            <TableHead className="text-end hidden sm:table-cell uppercase text-[9px] tracking-wider font-bold text-muted-foreground">{t('analytics.table.retention')}</TableHead>
            <TableHead className="text-end uppercase text-[9px] tracking-wider font-bold text-muted-foreground">{t('analytics.table.viral')}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((item) => (
            <TableRow key={item.id} className="ui-table-row">
              <TableCell className="ui-table-cell">
                <div className="flex items-center gap-3">
                  <img src={item.thumbnail} className="w-10 h-14 object-cover rounded border border-border" />
                  <div className="space-y-1">
                    <p className="ui-text-body-semibold leading-tight max-w-[120px] md:max-w-[200px] truncate">{item.title}</p>
                    <span className="ui-text-caption text-muted-foreground block font-bold">{item.platform}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="ui-table-cell ui-text-mono-label text-muted-foreground hidden md:table-cell">{item.game}</TableCell>
              <TableCell className="ui-table-cell">
                <Badge variant="secondary" className="text-[8px] h-4 tracking-tighter uppercase">{t(`analytics.table.types.${item.type.toLowerCase()}`)}</Badge>
              </TableCell>
              <TableCell className="ui-table-cell text-end font-bold text-[11px]">{t('analytics.overview.views_label', { count: (item.views / 1000).toFixed(1) })}</TableCell>
              <TableCell className="ui-table-cell text-end font-bold text-brand-secondary">{item.engagement}{i18n.language === 'ar' ? '٪' : '%'}</TableCell>
              <TableCell className="ui-table-cell text-end font-bold opacity-60 hidden sm:table-cell">{item.retention ? `${item.retention}${i18n.language === 'ar' ? '٪' : '%'}` : '--'}</TableCell>
              <TableCell className="ui-table-cell text-end">
                <div className="inline-flex items-center gap-1 ui-text-caption text-primary px-1.5 py-0.5 rounded-full bg-primary/10">
                  <Zap size={10} className="fill-primary" /> {item.viral}
                </div>
              </TableCell>
              <TableCell className="ui-table-cell text-end">
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

ContentTab.displayName = "ContentTab";
