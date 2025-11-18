/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: SuccessModal
 * Descripción: modal de confirmación que muestra después de enviar una publicación con opciones para ir a mis publicaciones o publicar otro item
 */

'use client'

import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SuccessModal({
  isOpen,
  onClose,
  onPublishAnother,
}) {
  const router = useRouter()

  if (!isOpen) return null

  const handleGoToPublications = () => {
    onClose() // Cierra el modal
    router.push('/dashboard/publicaciones') // Redirige a la lista
  }

  return (
    // Fondo oscuro (Backdrop)
    <div
      // No cerramos al hacer clic en el fondo, forzamos una acción
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-lg rounded-xl bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle className="h-16 w-16 text-primary-500" />

          <h2 className="font-poppins text-3xl font-semibold text-primary-500">
            ¡Publicación enviada!
          </h2>

          <div className="w-full border-t border-neutral-300 pt-4">
            <p className="font-inter text-base text-neutral-700">
              ¡Excelente! Tu publicación ha sido recibida y está siendo
              revisada por nuestro equipo.
            </p>
            <p className="mt-2 font-inter text-base text-neutral-700">
              Recibirás una notificación por correo electrónico tan pronto
              como sea aprobado y esté activa en el Marketplace.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onPublishAnother} // Llama a la función del padre
              className="rounded-lg border border-neutral-300 bg-neutral-100 px-6 py-3 font-inter text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-200"
            >
              Publicar otro ítem
            </button>
            <button
              type="button"
              onClick={handleGoToPublications}
              className="rounded-lg bg-primary-500 px-6 py-3 font-inter text-sm font-semibold text-white transition-colors hover:bg-primary-600"
            >
              Ir a mis publicaciones
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}