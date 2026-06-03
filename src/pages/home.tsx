import { useGetFeaturedCampaigns, useGetCampaignStats, useGetRecentWinners, useListCampaigns } from "@workspace/api-client-react";
import { MainLayout } from "@/layouts/main-layout";
import { FloatingParticles } from "@/components/FloatingParticles";
import { CampaignCard } from "@/components/CampaignCard";
import { AnimatedButton } from "@/components/AnimatedButton";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, Sword, Sparkles, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetCampaignStats();
  const { data: featured, isLoading: featuredLoading } = useGetFeaturedCampaigns();
  const { data: quests, isLoading: questsLoading } = useListCampaigns({ type: "quest" });
  const { data: winners, isLoading: winnersLoading } = useGetRecentWinners();

  return (
    <MainLayout>
      <LoadingScreen />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-[0.03] mix-blend-overlay" />
        
        {/* Portal Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full portal-glow opacity-30 mix-blend-screen pointer-events-none" />
        
        <FloatingParticles />

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>A new season of quests has arrived</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black font-serif mb-6 leading-tight drop-shadow-xl text-foreground">
              Journey to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-accent">Eryth</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Complete epic quests, participate in community raffles, and earn rare rewards on your adventure through the Web3 realms.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/explore">
                <AnimatedButton size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                  Embark on Quest
                  <ChevronRight className="w-5 h-5 ml-2" />
                </AnimatedButton>
              </Link>
              <Link href="/host">
                <AnimatedButton variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 border-white/20 bg-background/50 hover:bg-background/80">
                  Host a Campaign
                </AnimatedButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b border-white/5 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Active Campaigns", value: stats?.activeCampaigns, loading: statsLoading },
              { label: "Total Participants", value: stats?.totalParticipants, loading: statsLoading },
              { label: "Rewards Distributed", value: stats?.rewardsDistributed, loading: statsLoading },
              { label: "Total XP Earned", value: stats?.totalXpEarned, loading: statsLoading },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                {stat.loading ? (
                  <Skeleton className="h-10 w-24 mx-auto mb-2" />
                ) : (
                  <div className="text-3xl md:text-4xl font-black font-serif text-accent mb-2">
                    {stat.value?.toLocaleString() || "0"}{stat.label.includes("XP") ? "+" : ""}
                  </div>
                )}
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4 flex items-center gap-3">
                <Trophy className="w-8 h-8 text-accent" />
                Featured Campaigns
              </h2>
              <p className="text-muted-foreground">The most lucrative opportunities in the realm.</p>
            </div>
            <Link href="/explore" className="hidden md:flex text-primary hover:text-primary/80 font-medium items-center gap-1 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)
              : featured?.slice(0, 3).map((campaign, i) => (
                  <CampaignCard key={campaign.id} campaign={campaign} delay={i * 0.1} />
                ))}
          </div>
        </div>
      </section>

      {/* Active Quests */}
      <section className="py-24 bg-secondary/10 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4 flex items-center gap-3">
                <Sword className="w-8 h-8 text-primary" />
                Active Quests
              </h2>
              <p className="text-muted-foreground">Prove your worth and earn XP to rank up.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {questsLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)
              : quests?.slice(0, 4).map((campaign, i) => (
                  <CampaignCard key={campaign.id} campaign={campaign} delay={i * 0.1} />
                ))}
          </div>
        </div>
      </section>

      {/* Recent Winners */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-serif mb-12">Recent Champions</h2>
          
          <div className="space-y-4">
            {winnersLoading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
              : winners?.slice(0, 5).map((winner, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    key={winner.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-card border border-white/5 hover:border-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <img src={winner.avatar} alt={winner.username} className="w-10 h-10 rounded-full border border-white/10" />
                      <div className="text-left">
                        <div className="font-bold">{winner.username}</div>
                        <div className="text-xs text-muted-foreground">{winner.campaignTitle}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-accent">{winner.reward}</div>
                      <div className="text-xs text-muted-foreground">{new Date(winner.wonAt).toLocaleDateString()}</div>
                    </div>
                  </motion.div>
                ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
