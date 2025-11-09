import Footer from '@/components/layout/Footer'
import NavBar from '@/components/layout/NavBar'

/**
 * Layout principal para las páginas públicas del marketplace (rutas en /app/(marketplace)).
 * Provee el header y footer estándar.
 */
export default function MarketplaceLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <NavBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}