"use client";

import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface ConfettiContextType {
  fire: (options?: confetti.Options) => void;
}

const ConfettiContext = createContext<ConfettiContextType | null>(null);

export const useConfetti = () => {
  const context = useContext(ConfettiContext);
  if (!context) {
    throw new Error("useConfetti must be used within a ConfettiProvider");
  }
  return context;
};

export const ConfettiProvider = ({
  children,
  options: globalOptions,
  ...props
}: {
  children: React.ReactNode;
  options?: confetti.Options;
  // allow other props to be passed to the div
  [key: string]: any;
}) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const fire = useCallback(
    (options: confetti.Options = {}) => {
      confetti({
        ...globalOptions,
        ...options,
      });
    },
    [globalOptions],
  );

  const contextValue = useMemo(() => ({ fire }), [fire]);

  return (
    <ConfettiContext.Provider value={contextValue}>
      <div className={cn("relative size-full")} {...props}>
        {children}
      </div>
      {isReady && <ConfettiInstance fire={fire} />}
    </ConfettiContext.Provider>
  );
};

const ConfettiInstance = ({
  fire,
}: {
  fire: (options?: confetti.Options) => void;
}) => {
  const [animation, setAnimation] = useState(0);
  const intervalId = useRef<NodeJS.Timeout>();

  const startAnimation = useCallback(() => {
    if (!intervalId.current) {
      intervalId.current = setInterval(() => {
        setAnimation((a) => a + 1);
      }, 3000);
    }
  }, []);

  const stopAnimation = useCallback(() => {
    clearInterval(intervalId.current);
    intervalId.current = undefined;
    setAnimation(0);
  }, []);

  useEffect(() => {
    // Fire confetti when the component mounts
    requestAnimationFrame(() => {
      fire();
    });

    // Start repeating animation
    startAnimation();

    // Clean up interval on unmount
    return () => {
      stopAnimation();
    };
  }, [fire, startAnimation, stopAnimation]);

  return null;
};
