/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#396539',
          600: '#294730',
        },
        secondary: {
          500: '#69391E',
          600: '#A2704F',
        },
        neutral: {
          900: '#262C32',
          600: '#555555', // Añadido para texto
          500: '#777777', // Añadido para texto
          100: '#F3F3F3',
          75: '#F5F5F5', // <-- AÑADIDO: Color de fondo del panel
          50: '#FCFCFC',
        },
        // --- AÑADIDOS: Colores de la tabla ---
        table: {
          header: '#353A43',
          body: '#596171',
          price: '#353A44',
        },
      },
      fontFamily: {
        poppins: ['var(--font-poppins)'],
        roboto: ['var(--font-roboto)'],
        inter: ['var(--font-inter)'],
      },
    },
  },
}