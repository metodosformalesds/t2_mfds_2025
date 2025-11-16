import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:grid-cols-5">
          {/* Columna Logo */}
          <div className="lg:col-span-2">
            <Link href="/">
              {/* Asumiendo un logo para fondo oscuro en public/images/logo-dark.svg */}
              <Image
                src="/images/LogoNoFondo.png"
                alt="Waste to Treasure Logo"
                width={100}
                height={80}
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-neutral-400">
              Transformando residuos industriales en tesoros locales. Promoviendo
              la economía circular en Ciudad Juárez.
            </p>
          </div>

          {/* Columna Explorar */}
          <div>
            <h3 className="font-roboto text-lg font-medium text-white">
              Explorar
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/materials" className="hover:text-white">
                  Materiales
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white">
                  Productos
                </Link>
              </li>
              <li>
                <Link href="/sellers" className="hover:text-white">
                  Productores locales
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna Participar */}
          <div>
            <h3 className="font-roboto text-lg font-medium text-white">
              Participar
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/dashboard/listings/new" className="hover:text-white">
                  Vender materiales
                </Link>
              </li>
              <li>
                <Link href="/dashboard/listings/new" className="hover:text-white">
                  Vender productos
                </Link>
              </li>
              <li>
                <Link href="/plans" className="hover:text-white">
                  Planes y precios
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna Compañía */}
          <div>
            <h3 className="font-roboto text-lg font-medium text-white">
              Compañía
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link href="/about" className="hover:text-white">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white">
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar - LÍNEA CAMBIADA */}
        <div className="mt-12 border-t border-neutral-700 pt-8 text-sm text-neutral-400">
          <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
            <p>&copy; 2025 Waste-To-Treasure. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <Link href="/legal/terms" className="hover:text-white">
                Términos de servicio
              </Link>
              <Link href="/legal/data-deletion" className="hover:text-white">
                Instrucciones para eliminación de datos 
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}