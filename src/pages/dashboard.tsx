import { useGetDashboard, useGetNotifications } from "@workspace/api-client-react";
import { MainLayout } from "@/layouts/main-layout";
import { PassportCard } from "@/components/PassportCard";
import { PortalCard } from "@/components/PortalCard";
import { CampaignCard } from "@/components/CampaignCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Bell, Wallet, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AnimatedButton } from "@/components/AnimatedButton";

export default function Dashboard() {
  const { data, isLoading } = useGetDashboard();
  const { data: notifications, isLoading: notifLoading } = useGetNotifications();
  const { toast } = useToast();

  const handleCopyReferral = () => {
    if (data?.referralCode) {
      navigator.clipboard.writeText(`https://earnity.quest/join?ref=${data.referralCode}`);
      toast({
        title: "Link Copied!",
        description: "Referral link copied to clipboard.",
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12 space-y-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div className="space-y-8">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!data) return null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 min-h-screen">
        <h1 className="text-3xl md:text-4xl font-bold font-serif mb-8 flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" />
          Command Center
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Wallet Status */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              data.walletConnected 
                ? "bg-emerald-500/10 border-emerald-500/30" 
                : "bg-destructive/10 border-destructive/30"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${data.walletConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-destructive/20 text-destructive"}`}>
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">{data.walletConnected ? "Wallet Connected" : "Wallet Disconnected"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {data.walletConnected ? "You are ready to claim on-chain rewards." : "Connect a wallet to receive rewards."}
                  </p>
                </div>
              </div>
              {!data.walletConnected && (
                <AnimatedButton variant="outline" className="border-destructive/50 hover:bg-destructive/20 text-destructive">
                  Connect Now
                </AnimatedButton>
              )}
            </div>

            {/* Active Campaigns */}
            <section>
              <h2 className="text-2xl font-bold font-serif mb-6">Your Active Adventures</h2>
              {data.joinedCampaigns && data.joinedCampaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.joinedCampaigns.map(c => (
                    <CampaignCard key={c.id} campaign={c} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-card/30 rounded-xl border border-white/5 border-dashed">
                  <p className="text-muted-foreground mb-4">You haven't joined any campaigns yet.</p>
                  <AnimatedButton onClick={() => window.location.href = '/explore'}>
                    Explore Campaigns
                  </AnimatedButton>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Stats Summary */}
            <PortalCard className="bg-card">
              <h3 className="font-bold mb-4 font-serif text-lg">Quest Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-md bg-secondary/30">
                  <span className="text-muted-foreground">Completed Quests</span>
                  <span className="font-bold text-lg text-emerald-400">{data.completedQuests}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-md bg-secondary/30">
                  <span className="text-muted-foreground">Pending Quests</span>
                  <span className="font-bold text-lg text-accent">{data.pendingQuests}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-md bg-secondary/30">
                  <span className="text-muted-foreground">Total XP</span>
                  <span className="font-bold text-lg text-primary">{data.totalXp}</span>
                </div>
              </div>
            </PortalCard>

            {/* Referral */}
            <PortalCard className="bg-card">
              <h3 className="font-bold mb-2 font-serif text-lg">Invite Travelers</h3>
              <p className="text-sm text-muted-foreground mb-4">Earn bonus XP when friends join using your referral link.</p>
              
              <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-background border border-white/10 rounded-md px-3 py-2 text-sm font-mono text-muted-foreground truncate select-all">
                  https://earnity.quest/join?ref={data.referralCode}
                </div>
                <button 
                  onClick={handleCopyReferral}
                  className="p-2 bg-secondary hover:bg-secondary/80 rounded-md transition-colors border border-white/10"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-sm text-center text-primary font-medium">
                {data.referralCount} travelers recruited
              </div>
            </PortalCard>

            {/* Notifications */}
            <PortalCard className="bg-card p-0 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <h3 className="font-bold font-serif text-lg">Notifications</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifLoading ? (
                  <div className="p-4 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : notifications && notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.id} className={`p-4 border-b border-white/5 last:border-0 ${!n.read ? 'bg-primary/5' : ''}`}>
                      <p className={`text-sm ${!n.read ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {n.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No new missives.
                  </div>
                )}
              </div>
            </PortalCard>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
