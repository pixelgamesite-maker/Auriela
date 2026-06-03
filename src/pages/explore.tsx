import { useState } from "react";
import { useListCampaigns } from "@workspace/api-client-react";
import { MainLayout } from "@/layouts/main-layout";
import { CampaignCard } from "@/components/CampaignCard";
import { Input } from "@/components/ui/input";
import { Search, Compass } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Explore() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  const { data: campaigns, isLoading } = useListCampaigns({
    search: search || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const types = [
    { value: "all", label: "All Types" },
    { value: "quest", label: "Quests" },
    { value: "raffle", label: "Raffles" },
    { value: "giveaway", label: "Giveaways" },
    { value: "whitelist", label: "Whitelists" },
    { value: "seasonal", label: "Seasonal" },
  ];

  const statuses = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "upcoming", label: "Upcoming" },
    { value: "ended", label: "Ended" },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 min-h-screen">
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 flex items-center gap-3">
            <Compass className="w-8 h-8 text-primary" />
            Explore the Realm
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Discover new campaigns, join communities, and earn epic rewards. Filter by type or status to find your next adventure.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm sticky top-20 z-30">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search campaigns by name or community..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-white/10 focus-visible:ring-primary"
            />
          </div>
          
          <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 hide-scrollbar">
            {types.map((t) => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(t.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  typeFilter === t.value 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background/50 border border-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === s.value 
                    ? "bg-secondary text-secondary-foreground" 
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {campaigns.map((campaign, i) => (
              <CampaignCard key={campaign.id} campaign={campaign} delay={i * 0.05} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-24 px-4 bg-card/30 rounded-xl border border-white/5 border-dashed">
            <Compass className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold font-serif mb-2">No campaigns found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The mists obscure any campaigns matching your search. Try adjusting your filters or search terms.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
