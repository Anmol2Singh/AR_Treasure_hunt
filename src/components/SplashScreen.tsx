import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 1000); // Wait for exit animation
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="fixed inset-0 z-[1000] bg-black flex items-center justify-center overflow-hidden"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 3, 
              ease: [0.22, 1, 0.36, 1],
              opacity: { duration: 2 }
            }}
            className="w-full h-full flex items-center justify-center"
          >
            <img 
              src="/assets/unity-splash.png" 
              alt="Made with Unity" 
              className="w-auto h-auto max-w-[85%] max-h-[85%] mix-blend-screen select-none pointer-events-none"
              style={{ filter: 'contrast(1.1) brightness(1.05)' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
