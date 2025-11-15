import { Poppins, Roboto, Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import '../styles/global.css'

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
})

const inter = Inter({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata = {
  title: 'Waste to Treasure - Economía Circular',
  description:
    'Plataforma de marketplace para materiales reciclados y productos sustentables',
  keywords: 'reciclaje, economía circular, materiales, productos sustentables',
  icons: {
    icon: 'icons/LogoNoFondo.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${roboto.variable} ${inter.variable}`}
    >
      {/* --- INICIO DE LA CORRECCIÓN ---
        Cambiado de bg-neutral-50 a bg-neutral-75 (#F5F5F5) 
        para coincidir con el fondo de tu diseño.
      --- FIN DE LA CORRECCIÓN ---
      */}
      <body className="font-inter antialiased bg-neutral-75">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}