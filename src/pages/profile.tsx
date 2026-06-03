import { useGetMyProfile, useGetMyActivity, useGetMyInventory } from "@workspace/api-client-react";
import { MainLayout } from "@/layouts/main-layout";
import { PassportCard } from "@/components/PassportCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { InventoryItem } from "@/components/InventoryItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Profile() {
  const { data: profile, isLoading: profileLoading } = useGetMyProfile();
  const { data: activity, isLoading: activityLoading } = useGetMyActivity();
  const { data: inventory, isLoading: inventoryLoading } = useGetMyInventory();

  if (profileLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-[250px] w-full max-w-4xl mx-auto rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  if (!profile) return null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 min-h-screen max-w-5xl">
        
        <div className="mb-12">
          <PassportCard profile={profile} />
        </div>

        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8 bg-card/50 border border-white/5">
            <TabsTrigger value="inventory" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-serif tracking-wide">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-serif tracking-wide">
              Chronicles
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="mt-0">
            {inventoryLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
              </div>
            ) : inventory && inventory.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {inventory.map((item) => (
                  <InventoryItem key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card/30 rounded-xl border border-white/5 border-dashed">
                <p className="text-muted-foreground">Your inventory is empty. Complete quests to earn rewards.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="activity" className="mt-0">
            <div className="bg-card/50 rounded-xl border border-white/5 p-6 md:p-8">
              {activityLoading ? (
                <div className="space-y-8">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-md" />)}
                </div>
              ) : (
                <ActivityFeed items={activity || []} />
              )}
            </div>
          </TabsContent>
        </Tabs>
        
      </div>
    </MainLayout>
  );
}
