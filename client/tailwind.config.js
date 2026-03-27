/** @type {import('tailwindcss').Config} */
module.exports = {
    // THIS is the line that makes your light/dark mode toggle work
    darkMode: 'class', 
    
    // This tells Tailwind to scan all your React components for Tailwind classes
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./public/index.html"
    ],
    
    theme: {
      extend: {
        // You can add custom brand colors here later if you want
        colors: {
          blurple: '#5B58FF',
        }
      },
    },
    plugins: [],
  }