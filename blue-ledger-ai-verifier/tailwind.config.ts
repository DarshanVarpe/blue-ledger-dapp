// blue-ledger-ai-verifier/tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}","./src/**/*.{js,ts,jsx,tsx,mdx}",],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))", // Existing
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          strong: "hsl(var(--accent-strong))", // Existing
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))", // Existing
          foreground: "hsl(var(--warning-foreground))", // Existing
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // --- NEW CUSTOM COLORS FROM LOVABLE ---
        ocean: {
          deep: "hsl(var(--ocean-deep))",
          primary: "hsl(var(--ocean-primary))",
          light: "hsl(var(--ocean-light))",
        },
        teal: {
          primary: "hsl(var(--teal-primary))",
          light: "hsl(var(--teal-light))",
        },
        sandy: {
          beige: "hsl(var(--sandy-beige))",
        },
        sage: {
          green: "hsl(var(--sage-green))",
        },
        // --- END NEW CUSTOM COLORS ---
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": { // Existing fade-in
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-up": { // Existing slide-up
          from: {
            transform: "translateY(20px)",
            opacity: "0",
          },
          to: {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        // --- NEW KEYFRAMES FROM LOVABLE (if any, ensure no duplicates) ---
        // Lovable's keyframes for fade-in and scale-in are similar but slightly different,
        // so I'm omitting them to keep your existing animations. If you want Lovable's
        // specific card animations, you'd add 'fade-in-card' and 'scale-in-card' here
        // and reference them directly on the TradingPlatform page.
        // For now, Framer Motion will handle these directly as `variants`.
        // --- END NEW KEYFRAMES ---
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out", // Existing
        "slide-up": "slide-up 0.3s ease-out", // Existing
      },
      // --- NEW BACKGROUND IMAGES (GRADIENTS) FROM LOVABLE ---
      backgroundImage: {
        "gradient-ocean": "var(--gradient-ocean)",
        "gradient-seafoam": "var(--gradient-seafoam)", // Changed from lovable's "gradient-teal" to avoid conflict and align with your prompt.
        "gradient-depth": "var(--gradient-depth)", // Added
        "gradient-surface": "var(--gradient-surface)", // Added
        "gradient-subtle": "var(--gradient-subtle)", // Ensure this is also here if used
      },
      // --- NEW BOX SHADOWS FROM LOVABLE ---
      boxShadow: {
        "ocean": "var(--shadow-ocean)",
        "gentle": "var(--shadow-gentle)", // Added
        "card": "var(--shadow-card)", // Added (or merged if you had one)
        "elevated": "var(--shadow-elevated)", // Added if not existing
      },
      // --- END NEW BACKGROUND IMAGES & BOX SHADOWS ---
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;