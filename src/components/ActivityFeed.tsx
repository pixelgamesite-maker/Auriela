import { ActivityItem } from "@workspace/api-client-react/src/generated/api.schemas";
import { Target, Users, Gift, ArrowUpCircle } from "lucide-react";

interface ActivityFeedProps {
  items: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "quest_complete": return <Target className="w-4 h-4 text-emerald-400" />;
      case "campaign_join": return <Users className="w-4 h-4 text-blue-400" />;
      case "reward_claim": return <Gift className="w-4 h-4 text-accent" />;
      case "rank_up": return <ArrowUpCircle className="w-4 h-4 text-primary" />;
      default: return <Target className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No recent activity. Embark on a quest!
      </div>
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
      {items.map((item) => (
        <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-secondary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10">
            {getIcon(item.type)}
          </div>
          
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-white/5 bg-card/50 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-sm">{item.campaignTitle || "System"}</div>
              <time className="text-xs font-medium text-muted-foreground">
                {new Date(item.timestamp).toLocaleDateString()}
              </time>
            </div>
            <div className="text-sm text-muted-foreground">{item.description}</div>
            {item.xp > 0 && (
              <div className="mt-2 text-xs font-bold text-primary">+{item.xp} XP</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
