'use client'

import Link from 'next/link'
import {
  Trash2,
  AlertTriangle,
  Shield,
  Database,
  ChevronRight,
  UserX,
  Mail
} from 'lucide-react'
import Navbar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'

export default function DataDeletionPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-[#396539] text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              <Trash2 className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-poppins">
              Eliminación de Datos de Usuario
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto font-inter">
              Instrucciones para solicitar la eliminación de tu cuenta y datos personales
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Información importante */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-8 rounded-r-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-amber-900 mb-2 font-poppins">
                  Información Importante
                </h3>
                <ul className="text-amber-800 font-inter space-y-2 text-sm">
                  <li>• La eliminación de datos es <strong>irreversible</strong> y permanente.</li>
                  <li>• Se eliminarán todos tus datos personales, publicaciones y transacciones.</li>
                  <li>• No podrás recuperar tu cuenta una vez eliminada.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Métodos de eliminación */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6 font-poppins">
              Cómo Eliminar tus Datos
            </h2>

            <div className="space-y-6">
              {/* Método 1: Desde la App */}
              <div className="border-l-4 border-primary-600 pl-6 py-2">
                <h3 className="text-xl font-semibold text-neutral-900 mb-4 font-poppins flex items-center">
                  <UserX className="w-6 h-6 mr-2 text-primary-600" />
                  Opción 1: Desde tu Cuenta en Waste to Treasure
                </h3>
                <ol className="space-y-3">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-bold mr-4 flex-shrink-0 font-poppins text-sm">
                      1
                    </span>
                    <div>
                      <p className="text-gray-700 font-inter">
                        Inicia sesión en tu cuenta de Waste to Treasure
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-bold mr-4 flex-shrink-0 font-poppins text-sm">
                      2
                    </span>
                    <div>
                      <p className="text-gray-700 font-inter">
                        Ve a <strong>Configuración de Cuenta</strong> o <strong>Mi Perfil</strong>
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-bold mr-4 flex-shrink-0 font-poppins text-sm">
                      3
                    </span>
                    <div>
                      <p className="text-gray-700 font-inter">
                        Busca la opción <strong>"Eliminar mi cuenta"</strong> en la sección de Privacidad
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-bold mr-4 flex-shrink-0 font-poppins text-sm">
                      4
                    </span>
                    <div>
                      <p className="text-gray-700 font-inter">
                        Confirma la eliminación siguiendo las instrucciones en pantalla
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-bold mr-4 flex-shrink-0 font-poppins text-sm">
                      5
                    </span>
                    <div>
                      <p className="text-gray-700 font-inter">
                        Recibirás un correo de confirmación cuando se complete la eliminación
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Método 2: Por correo electrónico */}
              <div className="border-l-4 border-blue-600 pl-6 py-2">
                <h3 className="text-xl font-semibold text-neutral-900 mb-4 font-poppins flex items-center">
                  <Mail className="w-6 h-6 mr-2 text-blue-600" />
                  Opción 2: Solicitar Eliminación por Correo Electrónico
                </h3>
                <ol className="space-y-3">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold mr-4 flex-shrink-0 font-poppins text-sm">
                      1
                    </span>
                    <div>
                      <p className="text-gray-700 font-inter">
                        Envía un correo electrónico a:{' '}
                        <a
                          href="mailto:support@waste-to-treasure.com"
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          support@waste-to-treasure.com
                        </a>
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold mr-4 flex-shrink-0 font-poppins text-sm">
                      2
                    </span>
                    <div>
                      <p className="text-gray-700 font-inter mb-2">
                        Incluye en el asunto: <strong>"Solicitud de Eliminación de Datos"</strong>
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold mr-4 flex-shrink-0 font-poppins text-sm">
                      3
                    </span>
                    <div>
                      <p className="text-gray-700 font-inter mb-2">
                        En el mensaje, proporciona:
                      </p>
                      <ul className="ml-4 space-y-1 text-gray-600 text-sm">
                        <li>• Tu nombre completo</li>
                        <li>• El correo electrónico registrado en tu cuenta</li>
                        <li>• Confirmación de que deseas eliminar permanentemente tu cuenta</li>
                      </ul>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold mr-4 flex-shrink-0 font-poppins text-sm">
                      4
                    </span>
                    <div>
                      <p className="text-gray-700 font-inter">
                        Nuestro equipo procesará tu solicitud en un plazo de <strong>7 días hábiles</strong>
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold mr-4 flex-shrink-0 font-poppins text-sm">
                      5
                    </span>
                    <div>
                      <p className="text-gray-700 font-inter">
                        Recibirás una confirmación por correo cuando tus datos hayan sido eliminados
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Qué datos se eliminarán */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <Database className="w-6 h-6 text-primary-600 mr-3" />
              <h2 className="text-2xl font-bold text-neutral-900 font-poppins">
                Datos que se Eliminarán
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-neutral-900 mb-3 font-poppins">
                  Información Personal
                </h3>
                <ul className="space-y-2 text-gray-700 font-inter text-sm">
                  <li>✓ Nombre y apellidos</li>
                  <li>✓ Correo electrónico</li>
                  <li>✓ Foto de perfil</li>
                  <li>✓ Información de contacto</li>
                  <li>✓ Datos de autenticación (Facebook, Google, etc.)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-neutral-900 mb-3 font-poppins">
                  Actividad en la Plataforma
                </h3>
                <ul className="space-y-2 text-gray-700 font-inter text-sm">
                  <li>✓ Publicaciones de materiales y productos</li>
                  <li>✓ Historial de transacciones y pedidos</li>
                  <li>✓ Mensajes y comunicaciones</li>
                  <li>✓ Favoritos y búsquedas guardadas</li>
                  <li>✓ Valoraciones y comentarios</li>
                  <li>✓ Direcciones de envío</li>
                  <li>✓ Información de pago</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Usuarios de Facebook */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
            <div className="flex items-start">
              <Shield className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-blue-900 mb-2 font-poppins">
                  ¿Iniciaste sesión con Facebook?
                </h3>
                <p className="text-blue-800 font-inter text-sm mb-3">
                  Si iniciaste sesión en Waste to Treasure usando tu cuenta de Facebook, también puedes
                  eliminar tus datos desde la configuración de Facebook:
                </p>
                <ol className="text-blue-800 font-inter text-sm space-y-2 ml-4">
                  <li>1. Ve a tu perfil de Facebook</li>
                  <li>2. Abre <strong>Configuración y Privacidad → Configuración</strong></li>
                  <li>3. Ve a <strong>Aplicaciones y Sitios Web</strong></li>
                  <li>4. Busca <strong>Waste to Treasure</strong></li>
                  <li>5. Haz clic en <strong>Eliminar</strong></li>
                  <li>6. Selecciona <strong>Eliminar tus datos de actividad</strong></li>
                </ol>
                <p className="text-blue-800 font-inter text-sm mt-3">
                  Esto eliminará automáticamente todos tus datos de nuestra plataforma.
                </p>
              </div>
            </div>
          </div>

          {/* Alternativas */}
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
            <div className="flex items-start">
              <Shield className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-green-900 mb-2 font-poppins">
                  ¿Solo quieres desactivar tu cuenta temporalmente?
                </h3>
                <p className="text-green-800 font-inter text-sm mb-3">
                  Si solo deseas tomar un descanso de la plataforma sin eliminar permanentemente tus datos,
                  considera desactivar tu cuenta en lugar de eliminarla. Podrás reactivarla en cualquier momento.
                </p>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center text-green-700 hover:text-green-900 font-semibold text-sm font-poppins"
                >
                  Ir a Configuración de Cuenta →
                </Link>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="text-center mt-12">
            <p className="text-gray-600 font-inter mb-4">
              ¿Tienes preguntas sobre la eliminación de datos?
            </p>
            <Link
              href="/contact"
              className="text-primary-600 hover:underline font-semibold font-poppins"
            >
              Contáctanos
            </Link>
            <span className="text-gray-400 mx-3">|</span>
            <Link
              href="/legal/terms"
              className="text-primary-600 hover:underline font-semibold font-poppins"
            >
              Términos y Condiciones
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
