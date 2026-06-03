export const RARITY_COLORS: Record<string, string> = {
  common: "text-gray-400 border-gray-400/30 bg-gray-400/10",
  uncommon: "text-green-400 border-green-400/30 bg-green-400/10",
  rare: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  epic: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  legendary: "text-yellow-400 border-yellow-400/50 bg-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.5)]",
};

export const RANK_COLORS: Record<string, string> = {
  E: "text-gray-400 drop-shadow-[0_0_5px_rgba(156,163,175,0.5)]",
  D: "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]",
  C: "text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]",
  B: "text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]",
  A: "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]",
  S: "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]",
  SS: "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]",
  SSS: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)] animate-pulse",
};
