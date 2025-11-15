import Footer from '@/components/layout/Footer'
import NavBar from '@/components/layout/NavBar'
import GlobalConfirmModal from '@/components/admin/GlobalConfirmModal'

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
      {/* Agregar el modal de confirmación global */}
      <GlobalConfirmModal />
    </div>
  )
}