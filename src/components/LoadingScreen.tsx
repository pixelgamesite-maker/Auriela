import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background overflow-hidden"
          data-testid="loading-screen"
        >
          {/* Background particles */}
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary rounded-full"
                initial={{ 
                  x: "50%", y: "50%", 
                  opacity: 0, scale: 0 
                }}
                animate={{
                  x: `${50 + (Math.random() * 100 - 50)}%`,
                  y: `${50 + (Math.random() * 100 - 50)}%`,
                  opacity: [0, 1, 0],
                  scale: [0, Math.random() * 3, 0]
                }}
                transition={{
                  duration: 1 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>

          {/* Portal opening effect */}
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [0, 1.2, 50], rotate: 180 }}
            transition={{ duration: 2, ease: "easeIn" }}
            className="w-32 h-32 rounded-full border-[20px] border-primary blur-[10px]"
          />
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 1.5, times: [0, 0.8, 1] }}
            className="absolute flex flex-col items-center gap-4 z-10"
          >
            <div className="font-serif text-3xl font-bold text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
              EARNITY QUEST
            </div>
            <div className="text-primary-foreground/70 text-sm tracking-widest uppercase">
              Opening portal...
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
