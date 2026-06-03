import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  endsAt: string | Date;
  className?: string;
}

export function CountdownTimer({ endsAt, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endsAt).getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null); // Ended
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (!timeLeft) {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground font-medium", className)}>
        <Clock className="w-3.5 h-3.5" />
        <span>Ended</span>
      </div>
    );
  }

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24;

  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium",
        isUrgent ? "text-destructive drop-shadow-[0_0_2px_rgba(239,68,68,0.5)]" : "text-primary/90",
        className
      )}
      data-testid="countdown-timer"
    >
      <Clock className="w-3.5 h-3.5" />
      <span>
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {timeLeft.hours.toString().padStart(2, "0")}h{" "}
        {timeLeft.minutes.toString().padStart(2, "0")}m{" "}
        {timeLeft.seconds.toString().padStart(2, "0")}s
      </span>
    </div>
  );
}
