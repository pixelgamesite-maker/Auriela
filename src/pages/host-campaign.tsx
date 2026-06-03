import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateCampaign } from "@workspace/api-client-react";
import { MainLayout } from "@/layouts/main-layout";
import { AnimatedButton } from "@/components/AnimatedButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Scroll, Target, Trophy, Clock, CheckCircle } from "lucide-react";
import { PortalCard } from "@/components/PortalCard";
import { Button } from "react-day-picker";

export default function HostCampaign() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createCampaign = useCreateCampaign();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "quest",
    rewardPool: "",
    requirements: [""],
    endsAt: "",
  });

  const handleNext = () => setStep((s) => Math.min(4, s + 1));
  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  const handleReqChange = (index: number, value: string) => {
    const newReqs = [...formData.requirements];
    newReqs[index] = value;
    setFormData({ ...formData, requirements: newReqs });
  };

  const addReq = () => {
    setFormData({ ...formData, requirements: [...formData.requirements, ""] });
  };

  const submit = () => {
    createCampaign.mutate(
      { 
        data: {
          ...formData,
          requirements: formData.requirements.filter(r => r.trim() !== ""),
          endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        } 
      },
      {
        onSuccess: (data) => {
          toast({
            title: "Decree Published!",
            description: "Your campaign has been successfully created.",
          });
          setLocation(`/campaigns/${data.id}`);
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Failed to publish",
            description: "Dark magic interfered with the creation process.",
          });
        }
      }
    );
  };

  const steps = [
    { num: 1, title: "Basic Info", icon: Scroll },
    { num: 2, title: "Rewards", icon: Trophy },
    { num: 3, title: "Schedule", icon: Clock },
    { num: 4, title: "Review", icon: CheckCircle },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 max-w-3xl min-h-screen">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-serif mb-4">Host a Campaign</h1>
          <p className="text-muted-foreground">Draft a new decree and summon travelers to your cause.</p>
        </div>

        {/* Progress Tracker */}
        <div className="mb-12 relative">
          <Progress value={(step / 4) * 100} className="h-1 bg-secondary absolute top-1/2 -translate-y-1/2 z-0" />
          <div className="relative z-10 flex justify-between">
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                  step >= s.num 
                    ? "bg-primary border-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                    : "bg-background border-muted text-muted-foreground"
                }`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={`mt-2 text-xs font-medium uppercase tracking-wider ${step >= s.num ? "text-primary" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <PortalCard className="bg-card/80 p-8 border-primary/20 shadow-2xl">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-serif font-bold mb-6 text-accent">I. The Decree</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Campaign Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., The Great Airdrop of Eryth" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="bg-background/50 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Campaign Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                    <SelectTrigger id="type" className="bg-background/50 border-white/10">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quest">Quest Board</SelectItem>
                      <SelectItem value="raffle">Raffle</SelectItem>
                      <SelectItem value="giveaway">Giveaway</SelectItem>
                      <SelectItem value="whitelist">Whitelist</SelectItem>
                      <SelectItem value="seasonal">Seasonal Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea 
                    id="desc" 
                    placeholder="Describe the adventure..." 
                    className="h-32 bg-background/50 border-white/10 resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-serif font-bold mb-6 text-accent">II. Spoils & Trials</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reward">Reward Pool</Label>
                  <Input 
                    id="reward" 
                    placeholder="e.g., 1000 USDC + 5 Rare NFTs" 
                    value={formData.rewardPool}
                    onChange={(e) => setFormData({...formData, rewardPool: e.target.value})}
                    className="bg-background/50 border-white/10"
                  />
                </div>
                
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <Label>Requirements / Quests</Label>
                  {formData.requirements.map((req, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="bg-secondary/50 border border-white/10 rounded-md px-3 py-2 flex items-center justify-center text-muted-foreground">
                        {i + 1}
                      </div>
                      <Input 
                        placeholder={`Requirement ${i + 1}`}
                        value={req}
                        onChange={(e) => handleReqChange(i, e.target.value)}
                        className="bg-background/50 border-white/10"
                      />
                    </div>
                  ))}
                  <button 
                    onClick={addReq}
                    className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 mt-2 transition-colors"
                  >
                    + Add another requirement
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-serif font-bold mb-6 text-accent">III. Time in the Realm</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ends">End Date & Time</Label>
                  <Input 
                    id="ends" 
                    type="datetime-local" 
                    value={formData.endsAt}
                    onChange={(e) => setFormData({...formData, endsAt: e.target.value})}
                    className="bg-background/50 border-white/10"
                  />
                  <p className="text-xs text-muted-foreground mt-1">When does this campaign seal its doors?</p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-serif font-bold mb-6 text-accent">IV. Review Decree</h2>
              
              <div className="bg-background/50 rounded-lg p-6 border border-white/10 space-y-4 font-serif relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1577083165243-7f215e9cdba6?auto=format&fit=crop&q=80')] opacity-5 mix-blend-overlay pointer-events-none" />
                
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Title</div>
                  <div className="text-xl font-bold">{formData.title || "Untitled"}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Type</div>
                    <div className="font-bold text-primary capitalize">{formData.type}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Reward</div>
                    <div className="font-bold text-accent">{formData.rewardPool || "None specified"}</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Description</div>
                  <div className="text-sm font-sans">{formData.description || "No description."}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-10 pt-6 border-t border-white/10">
            <Button 
              variant="outline" 
              onClick={handlePrev} 
              disabled={step === 1}
              className="border-white/10 hover:bg-white/5"
            >
              Previous Step
            </Button>
            
            {step < 4 ? (
              <AnimatedButton onClick={handleNext} disabled={!formData.title && step === 1}>
                Next Step
              </AnimatedButton>
            ) : (
              <AnimatedButton onClick={submit} disabled={createCampaign.isPending}>
                {createCampaign.isPending ? "Publishing..." : "Publish Decree"}
              </AnimatedButton>
            )}
          </div>
        </PortalCard>
      </div>
    </MainLayout>
  );
}

