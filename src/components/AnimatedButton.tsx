import { motion } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends ButtonProps {
  glowColor?: string;
}

export function AnimatedButton({ 
  children, 
  className, 
  variant = "default",
  glowColor = "hsl(var(--primary))",
  ...props 
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative inline-block"
    >
      {variant === "default" && (
        <div 
          className="absolute inset-0 -z-10 rounded-md opacity-0 hover:opacity-100 blur-md transition-opacity duration-300"
          style={{ backgroundColor: glowColor }}
        />
      )}
      <Button 
        variant={variant}
        className={cn(
          "relative z-10 overflow-hidden font-medium", 
          variant === "default" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 -translate-x-full hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-20 pointer-events-none" />
        <span className="relative z-30 flex items-center gap-2">{children}</span>
      </Button>
    </motion.div>
  );
}
