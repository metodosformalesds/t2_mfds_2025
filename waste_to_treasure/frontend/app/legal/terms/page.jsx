'use client'

import Link from 'next/link'
import { 
  ScrollText, 
  Shield, 
  Users, 
  Package, 
  CreditCard, 
  Scale,
  ArrowLeft
} from 'lucide-react'
import Navbar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import TermSection from '@/components/homepage/TermSection'

// Nota: metadata no funciona en Client Components
// Si necesitas metadata, usa generateMetadata en un layout.js

export default function TermsPage() {
  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-[#396539] text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              <ScrollText className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-poppins">
              Términos y Condiciones
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto font-inter">
              Al usar Waste to Treasure, aceptas estos términos que garantizan una experiencia 
              justa y sostenible para todos.
            </p>
            <p className="text-sm text-white/60 mt-4 font-inter">
              Última actualización: Noviembre 2025
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Introducción */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-poppins">
              Bienvenido a Waste to Treasure
            </h2>
            <p className="text-gray-700 font-inter leading-relaxed mb-4">
              Estos Términos y Condiciones rigen el uso de la plataforma Waste to Treasure. 
              Al acceder o utilizar nuestros servicios, aceptas estar vinculado por estos Términos.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-inter text-sm">
                🌱 <strong>Nuestra misión:</strong> Facilitar la economía circular conectando a quienes tienen 
                materiales reciclables con quienes pueden darles una nueva vida.
              </p>
            </div>
          </div>

          {/* Secciones */}
          <div className="space-y-4">
            <TermSection icon={Users} title="1. Registro y Cuenta de Usuario" defaultOpen={true}>
              <ul className="list-disc pl-5 space-y-2">
                <li>Debes tener al menos 18 años para crear una cuenta.</li>
                <li>Eres responsable de mantener la confidencialidad de tus credenciales.</li>
                <li>La información proporcionada debe ser veraz y actualizada.</li>
                <li>Nos reservamos el derecho de suspender cuentas que violen estos términos.</li>
                <li>No puedes transferir tu cuenta a terceros sin autorización.</li>
              </ul>
            </TermSection>

            <TermSection icon={Package} title="2. Publicación de Materiales y Productos">
              <ul className="list-disc pl-5 space-y-2">
                <li>Solo puedes publicar materiales reciclables o productos sostenibles legales.</li>
                <li>Las descripciones deben ser precisas y las imágenes representativas.</li>
                <li>Está prohibido publicar materiales peligrosos, ilegales o regulados sin permisos.</li>
                <li>Las publicaciones están sujetas a revisión y aprobación por nuestro equipo.</li>
                <li>Nos reservamos el derecho de rechazar o eliminar publicaciones.</li>
              </ul>
            </TermSection>

            <TermSection icon={CreditCard} title="3. Transacciones y Pagos">
              <ul className="list-disc pl-5 space-y-2">
                <li>Los pagos se procesan a través de Stripe, un proveedor seguro.</li>
                <li>La Plataforma cobra una comisión del 5% sobre cada transacción.</li>
                <li>Los vendedores reciben sus fondos después de confirmar la entrega.</li>
                <li>Los reembolsos se procesan según nuestra política de devoluciones.</li>
                <li>No somos responsables de disputas entre compradores y vendedores.</li>
              </ul>
            </TermSection>

            <TermSection icon={Shield} title="4. Privacidad y Protección de Datos">
              <ul className="list-disc pl-5 space-y-2">
                <li>Recopilamos y procesamos datos según nuestra Política de Privacidad.</li>
                <li>Usamos AWS Cognito para la autenticación segura.</li>
                <li>No vendemos tu información personal a terceros.</li>
                <li>Puedes solicitar la eliminación de tus datos en cualquier momento.</li>
                <li>Implementamos medidas de seguridad para proteger tu información.</li>
              </ul>
            </TermSection>

            <TermSection icon={Scale} title="5. Responsabilidades y Limitaciones">
              <ul className="list-disc pl-5 space-y-2">
                <li>La Plataforma es un intermediario, no somos parte de las transacciones.</li>
                <li>No garantizamos la calidad de los materiales publicados por terceros.</li>
                <li>Los usuarios son responsables de cumplir con las leyes locales de reciclaje.</li>
                <li>No somos responsables de daños indirectos derivados del uso de la Plataforma.</li>
                <li>Nuestra responsabilidad máxima se limita al monto de la transacción.</li>
              </ul>
            </TermSection>

            <TermSection icon={ScrollText} title="6. Propiedad Intelectual">
              <ul className="list-disc pl-5 space-y-2">
                <li>El contenido de la Plataforma está protegido por derechos de autor.</li>
                <li>Los usuarios mantienen los derechos de su contenido publicado.</li>
                <li>Al publicar, otorgas licencia para mostrar tu contenido en la Plataforma.</li>
                <li>No puedes copiar o distribuir nuestro código o diseño sin permiso.</li>
                <li>Reporta cualquier violación de propiedad intelectual a nuestro equipo.</li>
              </ul>
            </TermSection>
          </div>

          {/* Aceptación */}
          <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
            <h3 className="text-xl font-bold text-neutral-900 mb-4 font-poppins">
              Aceptación de los Términos
            </h3>
            <p className="text-gray-700 font-inter mb-6">
              Al hacer clic en "Registrarse" o al utilizar nuestros servicios, confirmas que has leído, 
              entendido y aceptado estos Términos y Condiciones en su totalidad.
            </p>
          </div>

          {/* Contacto */}
          <div className="text-center mt-12">
            <p className="text-gray-600 font-inter">
              ¿Tienes preguntas sobre estos términos?{' '}
              <Link href="/contact" className="text-primary-600 hover:underline font-semibold">
                Contáctanos
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}