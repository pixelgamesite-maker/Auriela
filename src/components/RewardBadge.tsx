import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { RARITY_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface RewardBadgeProps {
  rarity: string;
  children: React.ReactNode;
  className?: string;
}

export function RewardBadge({ rarity, children, className }: RewardBadgeProps) {
  const normalizedRarity = rarity?.toLowerCase() || "common";
  const colorClass = RARITY_COLORS[normalizedRarity] || RARITY_COLORS.common;
  const isLegendary = normalizedRarity === "legendary";

  return (
    <Badge 
      variant="outline" 
      className={cn("px-2 py-0.5 rounded-md font-medium capitalize", colorClass, className)}
      data-testid={`badge-rarity-${normalizedRarity}`}
    >
      {isLegendary ? (
        <motion.span
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{ backgroundSize: "200% auto" }}
          className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-white to-yellow-400"
        >
          {children}
        </motion.span>
      ) : (
        <span>{children}</span>
      )}
    </Badge>
  );
}
