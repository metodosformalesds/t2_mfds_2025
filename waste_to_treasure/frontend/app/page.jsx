import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header temporal */}
      <header className="bg-primary-500 text-white py-4">
        <div className="container-custom flex items-center justify-between">
          <h1 className="text-2xl font-bold font-poppins">Waste to Treasure</h1>
          <nav className="space-x-4">
            <Link href="/materials" className="hover:underline">
              Materiales
            </Link>
            <Link href="/products" className="hover:underline">
              Productos
            </Link>
            <Link href="/login" className="hover:underline">
              Iniciar Sesión
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary-500 to-primary-600 text-white py-20">
          <div className="container-custom text-center">
            <h1 className="text-5xl font-bold font-poppins mb-6">
              Transformando Residuos en Recursos
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Conectamos empresas con residuos industriales y artesanos locales
              para promover la economía circular en Ciudad Juárez
            </p>
            <div className="space-x-4">
              <Link
                href="/materials"
                className="inline-block bg-white text-primary-500 font-medium py-3 px-8 rounded-lg hover:bg-neutral-100 transition"
              >
                Explorar Materiales
              </Link>
              <Link
                href="/products"
                className="inline-block bg-secondary-500 text-white font-medium py-3 px-8 rounded-lg hover:bg-secondary-600 transition"
              >
                Ver Productos
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 container-custom">
          <h2 className="text-3xl font-bold font-poppins text-center mb-12">
            ¿Cómo Funciona?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 border border-neutral-100 rounded-lg">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold font-roboto mb-2">
                Publica Materiales
              </h3>
              <p className="text-neutral-900">
                Empresas publican sus residuos industriales reutilizables
              </p>
            </div>

            <div className="text-center p-6 border border-neutral-100 rounded-lg">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold font-roboto mb-2">
                Artesanos Transforman
              </h3>
              <p className="text-neutral-900">
                Artesanos adquieren materiales y crean productos únicos
              </p>
            </div>

            <div className="text-center p-6 border border-neutral-100 rounded-lg">
              <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold font-roboto mb-2">
                Consumidores Compran
              </h3>
              <p className="text-neutral-900">
                Usuarios finales adquieren productos sustentables
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-secondary-500 text-white py-16">
          <div className="container-custom text-center">
            <h2 className="text-3xl font-bold font-poppins mb-4">
              ¿Listo para empezar?
            </h2>
            <p className="text-lg mb-8">
              Únete a nuestra comunidad de economía circular
            </p>
            <Link
              href="/register"
              className="inline-block bg-white text-secondary-500 font-medium py-3 px-8 rounded-lg hover:bg-neutral-100 transition"
            >
              Crear Cuenta Gratis
            </Link>
          </div>
        </section>
      </main>

      {/* Footer temporal */}
      <footer className="bg-neutral-900 text-white py-8">
        <div className="container-custom text-center">
          <p>&copy; 2025 Waste to Treasure. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
