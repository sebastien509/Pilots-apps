/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
    extend: {
    colors: {
    health: {
    bg: "#0b1220",
    glass: "rgba(255,255,255,0.08)",
    accent: "#6EE7B7"
    }
    },
    backdropBlur: {
    xs: '2px'
    },
    keyframes: {
    float: {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-8px)' }
    }
    },
    animation: {
    float: 'float 6s ease-in-out infinite'
    }
    }
    },
    plugins: []
    }