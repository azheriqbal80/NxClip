import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { db, handleFirestoreError, OperationType } from "../../firebase";
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import { UserProfile, Plan } from "../../types";
import { 
  Users, 
  ShieldCheck, 
  Trash2, 
  MoreVertical, 
  CheckCircle2, 
  XCircle,
  Mail,
  Calendar,
  ArrowLeft,
  ShieldAlert,
  User,
  Sparkles,
  Gamepad2,
  FileText,
  Clock,
  Image as ImageIcon,
  Cpu
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { DataGrid, ColumnDef, FilterDef } from "../../components/ui/data-grid";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "../../components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Separator } from "../../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Skeleton } from "../../components/ui/skeleton";

const MOCK_USERS: UserProfile[] = [
  { 
    uid: "m1", 
    email: "alex@example.com", 
    displayName: "Alex Creator", 
    role: "creator", 
    plan: "pro", 
    onboardingCompleted: true, 
    photoURL: null, 
    createdAt: { toDate: () => new Date("2024-01-15") },
    bio: "Hardcore FPS player and content creator. Specializing in high-octane gameplay highlights.",
    gameNiches: ["FPS", "Battle Royale", "Competitive"],
    games: ["Valorant", "Apex Legends", "Call of Duty"]
  },
  { 
    uid: "m2", 
    email: "sarah@example.com", 
    displayName: "Sarah Studio", 
    role: "admin", 
    plan: "studio", 
    onboardingCompleted: true, 
    photoURL: null, 
    createdAt: { toDate: () => new Date("2024-01-20") },
    bio: "Studio lead and community manager. Passionate about building gaming communities.",
    gameNiches: ["RPG", "Simulation", "Indie"],
    games: ["Stardew Valley", "The Sims 4", "Baldur's Gate 3"]
  },
  { 
    uid: "m3", 
    email: "mike@example.com", 
    displayName: "Mike Gamer", 
    role: "user", 
    plan: "free", 
    onboardingCompleted: false, 
    photoURL: null, 
    createdAt: { toDate: () => new Date("2024-02-05") },
    bio: "Casual gamer looking to improve my skills and share some fun moments.",
    gameNiches: ["Action", "Adventure"],
    games: ["Spider-Man 2", "God of War"]
  },
];

export default function AdminPanel() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedUsers: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push(doc.data() as UserProfile);
      });
      // Merge with mock data for demonstration purposes as requested
      setUsers([...fetchedUsers, ...MOCK_USERS]);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateRole = useCallback(async (uid: string, newRole: "admin" | "user" | "creator") => {
    setIsUpdating(true);
    try {
      if (!uid.startsWith("m")) {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { role: newRole });
      }
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
      if (selectedUser?.uid === uid) setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
      toast.success(t("admin.notifications.role_updated"), {
        description: t("admin.notifications.role_updated_desc", { role: newRole })
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      toast.error(t("admin.notifications.update_failed"), { description: t("admin.notifications.update_failed_desc") });
    } finally {
      setIsUpdating(false);
    }
  }, [selectedUser, t]);

  const handleUpdatePlan = useCallback(async (uid: string, newPlan: Plan) => {
    setIsUpdating(true);
    try {
      if (!uid.startsWith("m")) {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { plan: newPlan });
      }
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, plan: newPlan } : u));
      if (selectedUser?.uid === uid) setSelectedUser(prev => prev ? { ...prev, plan: newPlan } : null);
      toast.success(t("admin.notifications.plan_updated"), {
        description: t("admin.notifications.plan_updated_desc", { plan: newPlan })
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      toast.error(t("admin.notifications.update_failed"), { description: t("admin.notifications.plan_update_failed_desc") });
    } finally {
      setIsUpdating(false);
    }
  }, [selectedUser, t]);

  const handleDeleteUser = useCallback(async (uid: string) => {
    setIsUpdating(true);
    try {
      if (!uid.startsWith("m")) {
        await deleteDoc(doc(db, "users", uid));
      }
      setUsers(prev => prev.filter(u => u.uid !== uid));
      toast.success(t("admin.notifications.user_deleted"), {
        description: t("admin.notifications.user_deleted_desc")
      });
      setSelectedUser(null);
      setShowDeleteConfirm(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
      toast.error(t("admin.notifications.delete_failed"), { description: t("admin.notifications.delete_failed_desc") });
    } finally {
      setIsUpdating(false);
    }
  }, [t]);

  const columns = useMemo((): ColumnDef<UserProfile>[] => [
    {
      header: t("admin.table.columns.user"),
      cell: (user) => (
        <div className="flex items-center gap-4 text-left">
          <Avatar className="w-10 h-10 border border-border">
            <AvatarImage src={user.photoURL || undefined} referrerPolicy="no-referrer" />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.displayName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="ui-stack-sm gap-0">
            <p className="text-sm font-bold text-foreground">{user.displayName || t("admin.status.anonymous")}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail size={12} />
              {user.email}
            </p>
          </div>
        </div>
      )
    },
    {
      header: t("admin.table.columns.role"),
      cell: (user) => (
        <Badge variant="outline" className={cn(
          "rounded-md text-[10px] font-bold uppercase tracking-widest",
          user.role === "admin" 
            ? "border-destructive/30 text-destructive bg-destructive/5" 
            : user.role === "creator"
              ? "border-primary/30 text-primary bg-primary/5"
              : "border-border text-muted-foreground bg-muted/50"
        )}>
          {t(`admin.table.roles.${user.role}`)}
        </Badge>
      )
    },
    {
      header: t("admin.table.columns.plan"),
      cell: (user) => (
        <Badge variant={user.plan === "studio" ? "default" : "outline"} className={cn(
          "rounded-md text-[10px] font-bold uppercase tracking-widest",
          user.plan === "pro" && "border-primary/20 text-primary bg-primary/5"
        )}>
          {t(`profile.plans.${user.plan}`)}
        </Badge>
      )
    },
    {
      header: t("admin.table.columns.onboarding"),
      className: "hidden lg:table-cell",
      cell: (user) => (
        user.onboardingCompleted ? (
          <div className="flex items-center gap-1.5 text-teal-500 text-xs font-bold">
            <CheckCircle2 size={14} />
            {t("admin.dialog.onboarded")}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-500 text-xs font-bold">
            <XCircle size={14} />
            {t("admin.dialog.pending_onboarding")}
          </div>
        )
      )
    },
    {
      header: t("admin.table.columns.joined"),
      className: "hidden xl:table-cell text-right",
      cell: (user) => (
        <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
          <Calendar size={14} />
          {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString(t("app.locale") === "ar" ? "ar-EG" : "en-US") : t("admin.table.status.unknown")}
        </div>
      )
    },
    {
      header: t("admin.table.columns.actions"),
      className: "text-right",
      cell: (user) => (
        <Button 
          variant="ghost" 
          size="icon-lg" 
          className="text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedUser(user);
          }}
        >
          <MoreVertical size={18} />
        </Button>
      )
    }
  ], [t]); 

  const filters = useMemo((): FilterDef[] => [
    {
      label: t("admin.table.columns.role"),
      key: "role",
      options: [
        { label: t("admin.table.roles.admin"), value: "admin" },
        { label: t("admin.table.roles.creator"), value: "creator" },
        { label: t("admin.table.roles.user"), value: "user" },
      ]
    },
    {
      label: t("admin.table.columns.plan"),
      key: "plan",
      options: [
        { label: t("profile.plans.free"), value: "free" },
        { label: t("profile.plans.pro"), value: "pro" },
        { label: t("profile.plans.studio"), value: "studio" },
      ]
    }
  ], [t]);

  return (
    <div className="ui-dashboard-page p-4 md:p-8 transition-colors duration-300">
      <div className="ui-container-landing">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon-lg"
              onClick={() => navigate("/dashboard")}
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={24} />
            </Button>
            <div className="ui-stack-sm">
              <h1 className="ui-text-section-heading flex items-center gap-3">
                <ShieldCheck className="text-primary size-8" />
                {t("admin.header.title")}
              </h1>
              <p className="ui-text-body-lg text-muted-foreground">{t("admin.header.subtitle")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="brand-gradient"
              onClick={() => navigate("/admin/dev-suite")}
              className="gap-2 shrink-0 h-12 px-5 text-xs font-bold tracking-wider uppercase rounded-xl shadow-soft"
            >
              <Cpu size={16} className="animate-pulse" />
              Developer Suite Console
            </Button>
            
            <Card className="ui-panel bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="ui-icon-chip-primary w-12 h-12 shadow-soft">
                  <Users size={24} />
                </div>
                <div className="ui-stack-sm gap-0">
                  <p className="ui-text-mono-label text-muted-foreground uppercase tracking-widest">{t("admin.header.stats_label")}</p>
                  {loading ? (
                    <Skeleton className="h-8 w-24 bg-primary/20" />
                  ) : (
                    <p className="text-2xl font-black text-foreground tracking-tight">{users.length} <span className="text-[10px] ui-text-mono-label text-muted-foreground ml-1">{t("admin.header.stats_unit")}</span></p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User List */}
        {loading ? (
          <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden shadow-soft">
            <div className="p-6 flex justify-between items-center border-b border-border/50">
              <Skeleton className="h-10 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
            <div className="p-0">
              <div className="grid grid-cols-1 divide-y divide-border/30">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <DataGrid
            data={users}
            columns={columns}
            filters={filters}
            searchKey="email"
            searchPlaceholder={t("admin.table.search_placeholder")}
            pageSize={8}
            onRowClick={(user) => setSelectedUser(user)}
            emptyState={
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                  <Users size={32} />
                </div>
                <h3 className="text-lg font-bold text-foreground">{t("admin.table.empty_title")}</h3>
                <p className="text-muted-foreground">{t("admin.table.empty_desc")}</p>
              </div>
            }
          />
        )}
      </div>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="ui-dialog-shell sm:max-w-2xl p-0 overflow-hidden border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-8">
              <DialogHeader className="mb-10">
                <div className="flex items-center justify-between">
                  <DialogTitle className="ui-text-subheading-lg text-foreground">{t("admin.dialog.title", { name: selectedUser?.displayName || t("admin.status.anonymous") })}</DialogTitle>
                </div>
                <DialogDescription className="ui-text-body-md text-muted-foreground">{t("admin.dialog.desc")}</DialogDescription>
              </DialogHeader>

              {selectedUser && (
                <>
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
                    <Avatar className="w-32 h-32 border-4 border-border/50 rounded-xl shadow-soft-lg">
                      <AvatarImage src={selectedUser.photoURL || undefined} referrerPolicy="no-referrer" />
                      <AvatarFallback className="ui-text-display-hero text-4xl bg-primary/5 text-primary">
                        {selectedUser.displayName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center md:text-left space-y-3">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <h3 className="ui-text-card-title text-foreground">{selectedUser.displayName || t("admin.status.anonymous")}</h3>
                        <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border font-mono text-[10px] tracking-tight">
                          ID: {selectedUser.uid}
                        </Badge>
                      </div>
                      <p className="ui-text-body-md text-muted-foreground/80 flex items-center justify-center md:justify-start gap-2">
                        <Mail size={16} className="text-primary/60" />
                        {selectedUser.email}
                      </p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                        <Badge variant="outline" className="border-border/50 text-muted-foreground rounded-md px-3 py-1 ui-text-mono-label">
                          {t("admin.dialog.joined", { date: selectedUser.createdAt?.toDate ? selectedUser.createdAt.toDate().toLocaleDateString(t("app.locale") === "ar" ? "ar-EG" : "en-US") : t("admin.table.status.unknown") })}
                        </Badge>
                        <Badge variant="outline" className={cn(
                          "rounded-md px-3 py-1 ui-text-mono-label",
                          selectedUser.onboardingCompleted ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" : "border-amber-500/30 text-amber-500 bg-amber-500/5"
                        )}>
                          {selectedUser.onboardingCompleted ? t("admin.dialog.onboarded") : t("admin.dialog.pending_onboarding")}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="ui-tabs-list mb-10 w-full grid grid-cols-3">
                      <TabsTrigger value="overview" className="ui-tabs-trigger">{t("admin.dialog.tabs.overview")}</TabsTrigger>
                      <TabsTrigger value="profile" className="ui-tabs-trigger">{t("admin.dialog.tabs.profile")}</TabsTrigger>
                      <TabsTrigger value="management" className="ui-tabs-trigger">{t("admin.dialog.tabs.management")}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8 animate-in fade-in-50 duration-300 outline-none">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="ui-panel bg-muted/20 border-border/40 hover:border-primary/30 transition-colors">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="ui-icon-chip-primary w-8 h-8">
                                <ShieldAlert size={18} />
                              </div>
                              <h4 className="ui-text-mono-label text-muted-foreground">{t("admin.dialog.overview.current_role")}</h4>
                            </div>
                            <p className="ui-text-card-title text-foreground capitalize">{t(`admin.table.roles.${selectedUser.role}`)}</p>
                            <p className="ui-text-caption text-muted-foreground mt-2">{t("admin.dialog.overview.role_desc")}</p>
                          </CardContent>
                        </Card>
                        <Card className="ui-panel bg-muted/20 border-border/40 hover:border-primary/30 transition-colors">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="ui-icon-chip-primary w-8 h-8">
                                <Sparkles size={18} />
                              </div>
                              <h4 className="ui-text-mono-label text-muted-foreground">{t("admin.dialog.overview.active_plan")}</h4>
                            </div>
                            <p className="ui-text-card-title text-foreground capitalize">{t(`profile.plans.${selectedUser.plan}`)}</p>
                            <p className="ui-text-caption text-muted-foreground mt-2">{t("admin.dialog.overview.plan_desc")}</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-primary/60" />
                          <h4 className="ui-text-mono-label text-muted-foreground">{t("admin.dialog.overview.activity_title")}</h4>
                        </div>
                        <div className="space-y-2">
                          {[
                            { action: t("admin.dialog.activity.gen_image"), time: "2 hours ago", icon: ImageIcon },
                            { action: t("admin.dialog.activity.update_bio"), time: "1 day ago", icon: FileText },
                            { action: t("admin.dialog.activity.login"), time: "2 days ago", icon: User },
                          ].map((log, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted transition-colors">
                              <div className="flex items-center gap-3">
                                <log.icon size={14} className="text-primary/60" />
                                <span className="ui-text-body-md text-foreground/80">{log.action}</span>
                              </div>
                              <span className="ui-text-mono-label text-muted-foreground">{log.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="profile" className="space-y-8 animate-in fade-in-50 duration-300 outline-none">
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-primary/60">
                            <FileText size={16} />
                            <h4 className="ui-text-mono-label">{t("admin.dialog.profile.bio_title")}</h4>
                          </div>
                          <div className="p-6 rounded-xl bg-muted/20 border border-border/50">
                            <p className="ui-text-body-md text-foreground/80 leading-relaxed italic">
                              {selectedUser.bio || t("admin.dialog.profile.no_bio")}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-primary/60">
                            <Gamepad2 size={16} />
                            <h4 className="ui-text-mono-label">{t("admin.dialog.profile.niches_title")}</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedUser.gameNiches && selectedUser.gameNiches.length > 0 ? (
                              selectedUser.gameNiches.map((niche) => (
                                <Badge key={niche} variant="outline" className="border-primary/20 text-primary bg-primary/5 px-3 py-1 ui-text-mono-label">
                                  {niche}
                                </Badge>
                              ))
                            ) : (
                              <p className="ui-text-caption text-muted-foreground italic">{t("admin.dialog.profile.no_niches")}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-primary/60">
                            <Sparkles size={16} />
                            <h4 className="ui-text-mono-label">{t("admin.dialog.profile.games_title")}</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedUser.games && selectedUser.games.length > 0 ? (
                              selectedUser.games.map((game) => (
                                <Badge key={game} variant="outline" className="border-border text-foreground px-3 py-1 ui-text-mono-label">
                                  {game}
                                </Badge>
                              ))
                            ) : (
                              <p className="ui-text-caption text-muted-foreground italic">{t("admin.dialog.profile.no_games")}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="management" className="space-y-10 animate-in fade-in-50 duration-300 outline-none">
                      <div className="space-y-4">
                        <label className="ui-text-mono-label text-muted-foreground">{t("admin.dialog.management.role_title")}</label>
                        <div className="grid grid-cols-3 gap-3">
                          {(["user", "creator", "admin"] as const).map((role) => (
                            <Button
                              key={role}
                              variant={selectedUser.role === role ? "default" : "outline"}
                              onClick={() => handleUpdateRole(selectedUser.uid, role)}
                              disabled={isUpdating}
                              className={cn(
                                "rounded-lg font-bold text-xs h-12 gap-2 shadow-soft transition-all",
                                selectedUser.role === role ? "bg-primary text-primary-foreground border-transparent" : "bg-background border-border text-foreground hover:bg-muted"
                              )}
                            >
                              {role === "admin" ? <ShieldAlert size={14} /> : role === "creator" ? <Sparkles size={14} /> : <User size={14} />}
                              {t(`admin.table.roles.${role}`).toUpperCase()}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="ui-text-mono-label text-muted-foreground">{t("admin.dialog.management.plan_title")}</label>
                        <div className="grid grid-cols-3 gap-3">
                          {(["free", "pro", "studio"] as const).map((plan) => (
                            <Button
                              key={plan}
                              variant={selectedUser.plan === plan ? "default" : "outline"}
                              onClick={() => handleUpdatePlan(selectedUser.uid, plan)}
                              disabled={isUpdating}
                              className={cn(
                                "rounded-lg font-bold text-xs h-12 shadow-soft transition-all",
                                selectedUser.plan === plan ? "bg-foreground text-background border-transparent" : "bg-background border-border text-foreground hover:bg-muted"
                              )}
                            >
                              {t(`profile.plans.${plan}`).toUpperCase()}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Separator className="bg-border/30" />

                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-destructive">
                          <ShieldAlert size={18} />
                          <h4 className="ui-text-mono-label">{t("admin.dialog.management.delete_title")}</h4>
                        </div>
                        
                        {showDeleteConfirm === selectedUser.uid ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-destructive/10 p-6 rounded-xl border border-destructive/20 shadow-inner"
                          >
                            <p className="ui-text-body-md font-semibold text-destructive mb-6 text-center">
                              {t("admin.dialog.management.delete_warning", { name: selectedUser.displayName || t("admin.status.anonymous") })}
                            </p>
                            <div className="flex gap-4">
                              <Button 
                                variant="destructive"
                                onClick={() => handleDeleteUser(selectedUser.uid)}
                                disabled={isUpdating}
                                className="flex-grow h-12 rounded-lg font-bold shadow-soft"
                              >
                                {t("admin.dialog.management.confirm_btn")}
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-8 h-12 rounded-lg font-bold bg-background border-border"
                              >
                                {t("admin.dialog.management.abort_btn")}
                              </Button>
                            </div>
                          </motion.div>
                        ) : (
                          <Button 
                            variant="destructive"
                            onClick={() => setShowDeleteConfirm(selectedUser.uid)}
                            disabled={isUpdating}
                            className="w-full rounded-lg font-bold h-12 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/10 transition-all"
                          >
                            <Trash2 size={18} className="mr-2" />
                            {t("admin.dialog.management.delete_btn")}
                          </Button>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="mt-12 pt-8 border-t border-border/30 flex justify-end">
                    <Button 
                      variant="outline"
                      onClick={() => setSelectedUser(null)}
                      className="px-12 h-12 rounded-lg font-bold text-sm bg-muted/30 border-border text-foreground hover:bg-muted hover:border-primary/20 transition-all"
                    >
                      {t("admin.dialog.exit_btn")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
