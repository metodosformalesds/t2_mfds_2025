'use client'

import Link from 'next/link'
import { Check, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import CheckoutStepper from '@/components/checkout/CheckoutStepper'

export default function OrderSuccessPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-neutral-100 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Stepper */}
        <div className="mx-auto max-w-5xl">
          {/* Mostramos todos los pasos como completados */}
          <CheckoutStepper currentStep="confirmation" />
        </div>

        {/* Contenido de Confirmación */}
        <div className="relative mt-16 flex flex-col items-center text-center">
          
          {/* Pop-up de Vendedor */}
          <div className="absolute -top-16 right-0 hidden md:block lg:right-24">
            <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-lg">
              <AlertCircle className="h-6 w-6 text-primary-500" />
              <span className="font-inter text-base font-medium text-black">
                Ahora puedes coordinar la entrega con el vendedor
              </span>
            </div>
          </div>

          {/* Icono de Check */}
          <div className="flex h-48 w-48 items-center justify-center rounded-full bg-primary-500 shadow-xl">
            <Check size={100} className="text-white" />
          </div>

          {/* Texto */}
          <h1 className="mt-8 font-poppins text-5xl font-bold text-black">
            ¡Pedido confirmado!
          </h1>
          <p className="mt-4 font-inter text-lg text-neutral-700">
            Gracias por tu compra en Waste-To-Treasure
          </p>

          {/* Caja de Email */}
          <div className="mt-8 w-full max-w-lg rounded-lg border border-neutral-300 bg-white p-6 text-center">
            <p className="font-inter text-lg font-medium text-black">
              Hemos enviado un correo de confirmación a:
              <br />
              <span className="font-bold">{user?.email || 'tu correo'}</span>
            </p>
          </div>

          {/* Enlaces de Acción */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/dashboard/purchases"
              className="rounded-lg bg-primary-500 px-8 py-3 font-roboto text-lg font-bold text-white shadow-lg transition-all hover:bg-primary-600"
            >
              Ver mis compras
            </Link>
            <Link
              href="/materials"
              className="rounded-lg border-2 border-primary-500 bg-white px-8 py-3 font-roboto text-lg font-bold text-primary-500 shadow-lg transition-all hover:bg-primary-50"
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}