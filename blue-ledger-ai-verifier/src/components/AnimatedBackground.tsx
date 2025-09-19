// src/components/AnimatedBackground.tsx
import React, { useCallback, useMemo } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { type Container, type ISourceOptions } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim'; // or loadFull if you need more presets

export function AnimatedBackground() {
  const [particlesLoaded, setParticlesLoaded] = React.useState(false);

  // 1. Initialize Particles Engine
  // This hook runs once to load the "slim" engine which contains basic shapes
  React.useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesLoaded(true);
    });
  }, []);

  // 2. Define Particles Configuration
  // This configuration creates a subtle starry background and handles click interactions.
  const particlesOptions: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: "transparent", // Background color of the particles canvas itself
        },
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: "push", // On click, push new particles
          },
          onHover: {
            enable: true,
            mode: "grab", // On hover, particles grab each other
          },
        },
        modes: {
          push: {
            quantity: 4, // Push 4 particles on click
          },
          grab: {
            distance: 150, // Grab distance on hover
            links: {
              opacity: 0.5,
            },
          },
        },
      },
      particles: {
        color: {
          value: "#aedfe8", // Color of the particles
          animation: {
            enable: true,
            speed: 5,
            sync: false,
            // Vary color slightly over time
            // options: {
            //   h: { offset: { min: 0, max: 360 }, speed: 1, sync: false },
            //   s: { offset: { min: 50, max: 100 }, speed: 1, sync: false },
            //   l: { offset: { min: 50, max: 100 }, speed: 1, sync: false },
            // },
          }
        },
        links: {
          color: "#c6e6ee",
          distance: 150,
          enable: true,
          opacity: 0.3,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: true,
          speed: 0.5, // Slower movement for background ambiance
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: 80, // Number of particles
        },
        opacity: {
          value: { min: 0.3, max: 0.8 }, // Varying opacity
          animation: {
            enable: true,
            speed: 1,
            sync: false,
            startValue: "random",
          }
        },
        shape: {
          type: "circle", // Simple circle shapes
        },
        size: {
          value: { min: 0.5, max: 2 }, // Varying sizes
          animation: {
            enable: true,
            speed: 2,
            sync: false,
            startValue: "random",
          }
        },
      },
      detectRetina: true,
    }),
    [],
  );

  // 3. Callback for when particles are loaded (optional, useful for debugging)
  const particlesOnLoad = useCallback(async (container: Container | undefined) => {
    // console.log("Particles container loaded", container);
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {particlesLoaded && (
        <Particles
          id="tsparticles-background"
          options={particlesOptions}
          particlesLoaded={particlesOnLoad}
          className="w-full h-full" // Ensure Particles component fills its container
        />
      )}
    </div>
  );
}