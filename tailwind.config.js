/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        /* === VANTORIS Unified Institutional Palette === */
        navy: '#071C38',
        charcoal: '#F8FAFC',
        slate: '#F1F5F9',
        brass: '#C9A227',
        gold: '#C9A227',
        champagne: '#1F5EFF',
        gray: '#64748B',
        mint: '#16A34A',
        crimson: '#DC2626',
        warning: '#F59E0B',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': '#071C38',
          '2': '#16A34A',
          '3': '#64748B',
          '4': '#DC2626',
          '5': '#C9A227'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)']
      },
      fontSize: {
        'display': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h1': ['1.75rem', { lineHeight: '1.25', fontWeight: '700' }],
        'h2': ['1.375rem', { lineHeight: '1.3', fontWeight: '700' }],
        'h3': ['1.125rem', { lineHeight: '1.35', fontWeight: '600' }],
        'body': ['0.9375rem', { lineHeight: '1.6' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
      },
      boxShadow: {
        'institutional': '0 2px 12px rgba(7, 28, 56, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        'premium': '0 8px 28px rgba(7, 28, 56, 0.05), 0 2px 8px rgba(7, 28, 56, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        'float': '0 12px 36px rgba(7, 28, 56, 0.08), 0 4px 12px rgba(7, 28, 56, 0.04)',
        'navy': '0 8px 32px rgba(7, 28, 56, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' }
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' }
        },
        'typing-bounce': {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-4px)', opacity: '1' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.4s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
        'typing-bounce': 'typing-bounce 1.2s infinite ease-in-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
