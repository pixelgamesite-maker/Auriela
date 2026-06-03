import { HTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PortalCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glowColor?: string;
  delay?: number;
}

export function PortalCard({ 
  children, 
  className, 
  glowColor = "hsl(var(--primary))",
  delay = 0,
  ...props 
}: PortalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className={cn(
        "relative group rounded-xl border border-white/5 bg-card/50 backdrop-blur-sm overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Glow effect on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 20px 0 ${glowColor.replace(')', ' / 0.1)')}`,
          border: `1px solid ${glowColor.replace(')', ' / 0.3)')}`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 p-6 h-full">
        {children}
      </div>
    </motion.div>
  );
}
