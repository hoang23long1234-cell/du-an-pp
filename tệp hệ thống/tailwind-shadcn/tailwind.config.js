/**
 * SlideVault Ultra-Optimized Tailwind CSS + shadcn/ui Configuration
 * Supports Dynamic JIT, Obsidian Dark & Studio Light themes, Custom Typography & Animations
 */
if (typeof tailwind !== 'undefined') {
  tailwind.config = {
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
      container: {
        center: true,
        padding: "1.5rem",
        screens: {
          "2xl": "1440px",
        },
      },
      extend: {
        fontFamily: {
          sans: ['"Plus Jakarta Sans"', '"Be Vietnam Pro"', '"Inter"', 'system-ui', 'sans-serif'],
          display: ['"Montserrat"', '"Plus Jakarta Sans"', '"Be Vietnam Pro"', 'sans-serif'],
          mono: ['"JetBrains Mono"', 'monospace'],
        },
        colors: {
          border: "hsl(var(--border) / <alpha-value>)",
          input: "hsl(var(--input) / <alpha-value>)",
          ring: "hsl(var(--ring) / <alpha-value>)",
          background: "hsl(var(--background) / <alpha-value>)",
          foreground: "hsl(var(--foreground) / <alpha-value>)",
          primary: {
            DEFAULT: "hsl(var(--primary) / <alpha-value>)",
            foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
            50: '#f0fdf4',
            100: '#dcfce7',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
            foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
            foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          },
          muted: {
            DEFAULT: "hsl(var(--muted) / <alpha-value>)",
            foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          },
          accent: {
            DEFAULT: "hsl(var(--accent) / <alpha-value>)",
            foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          },
          popover: {
            DEFAULT: "hsl(var(--popover) / <alpha-value>)",
            foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          },
          card: {
            DEFAULT: "hsl(var(--card) / <alpha-value>)",
            foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          },
          brand: {
            50: '#f0f3ff',
            100: '#e0e7fe',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1',
            600: '#4f46e5',
            700: '#4338ca',
            800: '#3730a3',
            900: '#312e81',
            950: '#1e1b4b',
          },
          emeraldBrand: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
          },
          cyber: {
            cyan: '#38bdf8',
            indigo: '#6366f1',
            purple: '#8b5cf6',
            emerald: '#10b981',
            gold: '#f59e0b',
            rose: '#f43f5e',
          }
        },
        borderRadius: {
          '3xl': '1.5rem',
          '4xl': '2rem',
          '5xl': '2.5rem',
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        boxShadow: {
          'glow-indigo': '0 0 25px -4px rgba(99, 102, 241, 0.4)',
          'glow-cyan': '0 0 25px -4px rgba(56, 189, 248, 0.4)',
          'glow-emerald': '0 0 25px -4px rgba(16, 185, 129, 0.4)',
          'shadcn': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
          'shadcn-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          'soft-float': '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
        },
        keyframes: {
          "accordion-down": {
            from: { height: "0" },
            to: { height: "var(--radix-accordion-content-height)" },
          },
          "accordion-up": {
            from: { height: "var(--radix-accordion-content-height)" },
            to: { height: "0" },
          },
          "fade-in": {
            from: { opacity: "0", transform: "translateY(8px)" },
            to: { opacity: "1", transform: "translateY(0)" },
          },
          "float-slow": {
            "0%, 100%": { transform: "translateY(0px)" },
            "50%": { transform: "translateY(-6px)" },
          },
          "aurora": {
            "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
            "50%": { opacity: "0.8", transform: "scale(1.15)" },
          },
          "blink": {
            "0%, 100%": { opacity: "1" },
            "50%": { opacity: "0" },
          }
        },
        animation: {
          "accordion-down": "accordion-down 0.2s ease-out",
          "accordion-up": "accordion-up 0.2s ease-out",
          "fade-in": "fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          "float-slow": "float-slow 5s ease-in-out infinite",
          "aurora": "aurora 8s ease-in-out infinite",
          "blink": "blink 1s step-start infinite",
        },
      },
    },
  };
}
