import { motion } from "framer-motion";
import { RANK_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface RankDisplayProps {
  rank: string;
  className?: string;
  showLabel?: boolean;
}

export function RankDisplay({ rank, className, showLabel = true }: RankDisplayProps) {
  const normalizedRank = rank?.toUpperCase() || "E";
  const colorClass = RANK_COLORS[normalizedRank] || RANK_COLORS.E;
  const isSSS = normalizedRank === "SSS";

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <motion.div
        initial={isSSS ? { scale: 0.9 } : false}
        animate={isSSS ? { scale: [0.9, 1.1, 0.9] } : false}
        transition={isSSS ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
        className={cn(
          "text-4xl font-black font-serif tracking-tighter",
          colorClass
        )}
        data-testid={`rank-display-${normalizedRank}`}
      >
        {isSSS ? (
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500">
            {normalizedRank}
          </span>
        ) : (
          normalizedRank
        )}
      </motion.div>
      {showLabel && (
        <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
          Rank
        </span>
      )}
    </div>
  );
}
