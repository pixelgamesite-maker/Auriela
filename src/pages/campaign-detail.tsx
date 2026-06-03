import { useGetCampaign, useJoinCampaign, useCompleteQuest } from "@workspace/api-client-react";
import { MainLayout } from "@/layouts/main-layout";
import { RewardBadge } from "@/components/RewardBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { AnimatedButton } from "@/components/AnimatedButton";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import { CheckCircle, Circle, Trophy, Users, Shield, Target } from "lucide-react";

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const campaignId = Number(id);
  const { data: campaign, isLoading, refetch } = useGetCampaign(campaignId);
  const joinMutation = useJoinCampaign();
  const completeQuestMutation = useCompleteQuest();
  const { toast } = useToast();

  const handleJoin = () => {
    joinMutation.mutate({ id: campaignId }, {
      onSuccess: () => {
        toast({ title: "Joined Campaign", description: "Your journey begins now." });
        refetch();
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err?.message || "Failed to join." });
      }
    });
  };

  const handleCompleteQuest = (questId: number) => {
    completeQuestMutation.mutate({ id: questId }, {
      onSuccess: (res) => {
        toast({ 
          title: "Quest Completed!", 
          description: `You earned ${res.xpEarned} XP. ${res.message}` 
        });
        refetch();
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Quest Failed", description: err?.message || "Could not verify completion." });
      }
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="w-full h-[40vh] bg-secondary animate-pulse" />
        <div className="container mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-16 w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!campaign) return null;

  return (
    <MainLayout>
      {/* Banner */}
      <div 
        className="relative w-full h-[40vh] md:h-[50vh] flex items-end justify-center overflow-hidden border-b border-white/10"
        style={{
          background: `linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%), ${campaign.bannerColor}20`
        }}
      >
        <div 
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{ backgroundColor: campaign.bannerColor }}
        />
        <div className="container mx-auto px-4 relative z-10 pb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <RewardBadge rarity={campaign.rarity}>{campaign.rarity}</RewardBadge>
                <div className="bg-background/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10 uppercase tracking-wider">
                  {campaign.type}
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black font-serif drop-shadow-xl">{campaign.title}</h1>
            </div>
            
            <div className="flex items-center gap-4 bg-background/60 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/50">
                {campaign.communityAvatar ? (
                  <img src={campaign.communityAvatar} alt={campaign.communityName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center font-bold">
                    {campaign.communityName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Hosted By</div>
                <div className="font-bold text-lg">{campaign.communityName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <section className="prose prose-invert max-w-none font-sans text-muted-foreground">
              <p className="text-lg leading-relaxed">{campaign.description}</p>
            </section>

            {/* Quests List */}
            <section>
              <h2 className="text-2xl font-bold font-serif mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                Campaign Quests
              </h2>
              
              {campaign.progress !== undefined && campaign.progress !== null && (
                <div className="mb-6 p-4 rounded-xl bg-card border border-white/5">
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span>Progress</span>
                    <span className="text-primary">{Math.round(campaign.progress)}%</span>
                  </div>
                  <Progress value={campaign.progress} className="h-2 bg-secondary" />
                </div>
              )}

              <div className="space-y-4">
                {campaign.quests?.map((quest) => (
                  <div 
                    key={quest.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      quest.completed 
                        ? "bg-emerald-500/5 border-emerald-500/20" 
                        : "bg-card border-white/5 hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => !quest.completed && handleCompleteQuest(quest.id)}
                        disabled={quest.completed || completeQuestMutation.isPending}
                        className={`shrink-0 transition-colors ${
                          quest.completed ? "text-emerald-500 cursor-default" : "text-muted-foreground hover:text-primary"
                        }`}
                      >
                        {quest.completed ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </button>
                      <div>
                        <div className={`font-bold ${quest.completed ? "text-muted-foreground line-through" : ""}`}>
                          {quest.title}
                        </div>
                        <div className="text-sm text-muted-foreground">{quest.description}</div>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex items-center gap-4">
                      <div className="text-sm font-bold text-accent">+{quest.xpReward} XP</div>
                      {!quest.completed && quest.actionUrl && (
                        <a 
                          href={quest.actionUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-xs font-medium rounded-md transition-colors"
                        >
                          Go
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-white/5 p-6 sticky top-24">
              <div className="space-y-6">
                
                {/* Action Button */}
                <div className="pb-6 border-b border-white/5">
                  <AnimatedButton 
                    className="w-full text-lg py-6"
                    onClick={handleJoin}
                    disabled={joinMutation.isPending}
                  >
                    {joinMutation.isPending ? "Joining..." : "Join Campaign"}
                  </AnimatedButton>
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Trophy className="w-4 h-4" />
                      <span>Reward Pool</span>
                    </div>
                    <span className="font-bold text-accent">{campaign.rewardPool}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Participants</span>
                    </div>
                    <span className="font-bold">{campaign.participantCount.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      <span>Ends In</span>
                    </div>
                    <CountdownTimer endsAt={campaign.endsAt} />
                  </div>
                </div>

                {/* Requirements */}
                {campaign.requirements && campaign.requirements.length > 0 && (
                  <div className="pt-6 border-t border-white/5">
                    <h3 className="font-bold font-serif mb-3">Requirements</h3>
                    <ul className="space-y-2">
                      {campaign.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary mt-0.5">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
              </div>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
