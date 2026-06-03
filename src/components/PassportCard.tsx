import { UserProfile } from "@workspace/api-client-react/src/generated/api.schemas";
import { PortalCard } from "./PortalCard";
import { RankDisplay } from "./RankDisplay";
import { Progress } from "@/components/ui/progress";

interface PassportCardProps {
  profile: UserProfile;
}

export function PassportCard({ profile }: PassportCardProps) {
  const nextLevelXp = profile.level * 1000;
  const progressPercent = (profile.xp / nextLevelXp) * 100;

  return (
    <PortalCard className="relative overflow-hidden bg-card/80 border-primary/20 p-0">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/20 to-transparent" />
      
      <div className="p-6 relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="flex-shrink-0 relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/50 bg-secondary relative z-10">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold font-serif">
                {profile.username?.charAt(0)}
              </div>
            )}
          </div>
          <div className="absolute -bottom-3 -right-3 z-20 bg-background rounded-full p-1 border border-primary/30">
            <RankDisplay rank={profile.rank} showLabel={false} className="scale-75" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left w-full">
          <h2 className="text-2xl font-bold font-serif mb-1">{profile.username}</h2>
          <p className="text-sm text-muted-foreground mb-4">Traveler since {new Date(profile.joinedAt || Date.now()).toLocaleDateString()}</p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Level {profile.level}</span>
              <span className="text-primary">{profile.xp} / {nextLevelXp} XP</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-secondary" />
          </div>
        </div>

        <div className="flex-shrink-0 grid grid-cols-3 md:grid-cols-1 gap-4 w-full md:w-32 text-center">
          <div className="bg-secondary/50 rounded-lg p-2 border border-white/5">
            <div className="text-xl font-bold text-accent">{profile.questsCompleted}</div>
            <div className="text-xs text-muted-foreground">Quests</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 border border-white/5">
            <div className="text-xl font-bold text-primary">{profile.campaignsJoined}</div>
            <div className="text-xs text-muted-foreground">Campaigns</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 border border-white/5">
            <div className="text-xl font-bold text-emerald-400">{profile.rewardsEarned}</div>
            <div className="text-xs text-muted-foreground">Rewards</div>
          </div>
        </div>
      </div>
    </PortalCard>
  );
}
