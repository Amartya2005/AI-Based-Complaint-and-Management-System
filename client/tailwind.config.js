/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#ecfeff',
                    100: '#cffafe',
                    200: '#a5f3fc',
                    300: '#67e8f9',
                    400: '#22d3ee',
                    500: '#00c4cc',
                    600: '#00a1a8',
                    700: '#008188',
                    800: '#006168',
                    900: '#004e54',
                    950: '#00363b',
                    DEFAULT: '#00c4cc',
                },
                primary: {
                    DEFAULT: '#00c4cc',
                    light: '#22d3ee',
                    dark: '#00a1a8',
                },
                accent: {
                    DEFAULT: '#fb923c', // orange-400
                    light: '#fdba74', // orange-300
                    dark: '#f97316', // orange-500
                },
                surface: '#f4f7f6',
                sidebar: {
                    from: '#1e2330',
                    to: '#2c323f',
                },
            }
        },
    },
    plugins: [],
}
