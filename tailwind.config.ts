import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      fontFamily: {
        'advent': ['Advent Pro', 'sans-serif'],
        'vt323': ['VT323', 'monospace'],
        'sans': ['Advent Pro', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['clamp(0.65rem, 0.6rem + 0.25vw, 0.75rem)', { lineHeight: '1rem' }],
        'sm': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.25rem' }],
        'base': ['clamp(0.875rem, 0.8rem + 0.375vw, 1rem)', { lineHeight: '1.5rem' }],
        'lg': ['clamp(1rem, 0.9rem + 0.5vw, 1.125rem)', { lineHeight: '1.75rem' }],
        'xl': ['clamp(1.125rem, 1rem + 0.625vw, 1.25rem)', { lineHeight: '1.75rem' }],
        '2xl': ['clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)', { lineHeight: '2rem' }],
        '3xl': ['clamp(1.5rem, 1.3rem + 1vw, 1.875rem)', { lineHeight: '2.25rem' }],
        '4xl': ['clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem)', { lineHeight: '2.5rem' }],
        '5xl': ['clamp(2.25rem, 1.9rem + 1.75vw, 3rem)', { lineHeight: '1' }],
        '6xl': ['clamp(2.75rem, 2.2rem + 2.75vw, 3.75rem)', { lineHeight: '1' }],
        '7xl': ['clamp(3.5rem, 2.8rem + 3.5vw, 4.5rem)', { lineHeight: '1' }],
        '8xl': ['clamp(4.5rem, 3.5rem + 5vw, 6rem)', { lineHeight: '1' }],
        '9xl': ['clamp(6rem, 4.5rem + 7.5vw, 8rem)', { lineHeight: '1' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        premium: {
          DEFAULT: "hsl(var(--premium))",
          foreground: "hsl(var(--premium-foreground))",
        },
        marker: {
          museum: "hsl(var(--marker-museum))",
          cafe: "hsl(var(--marker-cafe))",
          public: "hsl(var(--marker-public))",
          park: "hsl(var(--marker-park))",
          landmark: "hsl(var(--marker-landmark))",
          entertainment: "hsl(var(--marker-entertainment))",
        },
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
        "fade-in": {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "scale-in": {
          "0%": {
            transform: "scale(0.95)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
