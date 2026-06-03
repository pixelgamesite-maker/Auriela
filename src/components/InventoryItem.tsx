import { InventoryItem as InventoryItemType } from "@workspace/api-client-react/src/generated/api.schemas";
import { RewardBadge } from "./RewardBadge";
import { Coins, Image, Shield, BadgeCheck, Package } from "lucide-react";

interface InventoryItemProps {
  item: InventoryItemType;
}

export function InventoryItem({ item }: InventoryItemProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "token": return <Coins className="w-8 h-8 opacity-50" />;
      case "nft": return <Image className="w-8 h-8 opacity-50" />;
      case "whitelist": return <Shield className="w-8 h-8 opacity-50" />;
      case "badge": return <BadgeCheck className="w-8 h-8 opacity-50" />;
      default: return <Package className="w-8 h-8 opacity-50" />;
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-secondary/30 hover:bg-secondary/50 transition-colors p-4 flex flex-col items-center text-center">
      <div className="absolute top-2 right-2">
        <RewardBadge rarity={item.rarity} className="text-[10px] px-1.5">
          {item.rarity}
        </RewardBadge>
      </div>
      
      <div className="w-16 h-16 rounded-full bg-background/50 flex items-center justify-center mb-3 mt-4 border border-white/5 group-hover:scale-110 transition-transform">
        {item.icon ? (
          <img src={item.icon} alt={item.name} className="w-10 h-10 object-contain" />
        ) : (
          getTypeIcon(item.type)
        )}
      </div>
      
      <h4 className="font-bold text-sm mb-1">{item.name}</h4>
      <p className="text-xs text-muted-foreground line-clamp-2">{item.description || "A mysterious item."}</p>
      
      {!item.claimed && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-md">
            Claim
          </button>
        </div>
      )}
    </div>
  );
}
