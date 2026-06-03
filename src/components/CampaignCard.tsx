import { motion } from "framer-motion";
import { Link } from "wouter";
import { Users, Trophy, Sparkles, Target, CalendarDays, Gift } from "lucide-react";
import { Campaign } from "@workspace/api-client-react/src/generated/api.schemas";
import { PortalCard } from "./PortalCard";
import { RewardBadge } from "./RewardBadge";
import { CountdownTimer } from "./CountdownTimer";

interface CampaignCardProps {
  campaign: Campaign;
  delay?: number;
}

export function CampaignCard({ campaign, delay = 0 }: CampaignCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "quest": return <Target className="w-4 h-4" />;
      case "raffle": return <Gift className="w-4 h-4" />;
      case "giveaway": return <Sparkles className="w-4 h-4" />;
      case "whitelist": return <Users className="w-4 h-4" />;
      case "seasonal": return <CalendarDays className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <Link href={`/campaigns/${campaign.id}`} data-testid={`card-campaign-${campaign.id}`}>
      <PortalCard delay={delay} className="h-full flex flex-col cursor-pointer transition-all hover:border-primary/50">
        <div className="flex justify-between items-start mb-4">
          <RewardBadge rarity={campaign.rarity}>
            {campaign.rarity}
          </RewardBadge>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary/80 rounded-md text-xs font-medium text-secondary-foreground">
            {getTypeIcon(campaign.type)}
            <span className="capitalize">{campaign.type}</span>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold font-serif mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {campaign.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {campaign.description || "No description provided."}
          </p>
        </div>

        <div className="space-y-4 mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-secondary overflow-hidden border border-white/10">
                {campaign.communityAvatar ? (
                  <img src={campaign.communityAvatar} alt={campaign.communityName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                    {campaign.communityName?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-muted-foreground">{campaign.communityName}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-accent font-medium">
              <Trophy className="w-3.5 h-3.5" />
              <span>{campaign.rewardPool}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{campaign.participantCount?.toLocaleString() || 0} travelers</span>
            </div>
            <CountdownTimer endsAt={campaign.endsAt} />
          </div>
        </div>
      </PortalCard>
    </Link>
  );
}
