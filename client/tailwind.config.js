/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1e3a8a', // deeper blue (blue-900)
                    light: '#3b82f6', // blue-500
                    dark: '#172554', // blue-950
                },
                accent: {
                    DEFAULT: '#fb923c', // orange-400
                    light: '#fdba74', // orange-300
                    dark: '#f97316', // orange-500
                }
            }
        },
    },
    plugins: [],
}
