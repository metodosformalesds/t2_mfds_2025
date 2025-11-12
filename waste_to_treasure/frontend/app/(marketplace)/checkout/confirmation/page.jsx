'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthGuard } from '@/hooks/useAdminGuard'
import { useCartStore } from '@/stores/useCartStore'
import { useCheckoutStore } from '@/stores/useCheckoutStore'
import { useConfirmStore } from '@/stores/useConfirmStore'
import { ordersService } from '@/lib/api/orders'
import { addressService } from '@/lib/api/address'
import CheckoutStepper from '@/components/checkout/CheckoutStepper'
import ConfirmationProductCard from '@/components/checkout/ConfirmationProductCard'
import CheckoutSummary from '@/components/checkout/CheckoutSummary'

export default function ConfirmationPage() {
  const { isAuthorized, isLoading: isAuthLoading } = useAuthGuard()
  const router = useRouter()
  const { items: cartItems, clearCart } = useCartStore()
  const { addressId, shippingMethod, paymentMethodId, clearCheckout } = useCheckoutStore()
  const openConfirmModal = useConfirmStore(state => state.open)

  const [address, setAddress] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  // Cargar los detalles de la dirección seleccionada
  useEffect(() => {
    if (isAuthorized) {
      if (!addressId || !paymentMethodId) {
        // Validación: si faltan datos, regresar a los pasos anteriores
        router.replace('/checkout')
        return
      }

      const fetchAddress = async () => {
        try {
          setIsLoading(true)
          const data = await addressService.getMyAddresses()
          const found = data.items.find(a => a.address_id === addressId)
          setAddress(found)
        } catch (error) {
          console.error("Error al cargar la dirección:", error)
        } finally {
          setIsLoading(false)
        }
      }
      fetchAddress()
    }
  }, [isAuthorized, addressId, paymentMethodId, router])

  const handleConfirmAndPay = () => {
    openConfirmModal(
      'Confirmar Pedido',
      '¿Estás seguro de que deseas confirmar y pagar este pedido?',
      async () => {
        setIsPlacingOrder(true)
        try {
          // 1. Procesar el pago y crear la orden
          await ordersService.processCheckout({
            payment_token: paymentMethodId, // (Simulado si no es un token real)
            shipping_address_id: addressId,
            shipping_method_id: shippingMethod?.method_id,
          })

          // 2. Limpiar estados
          clearCheckout()
          clearCart()
          
          // 3. Redirigir a la página de éxito
          router.push('/checkout/success')

        } catch (error) {
          console.error("Error al confirmar el pago:", error)
          openConfirmModal(
            'Error en el Pago',
            `No se pudo procesar tu pedido: ${error.message}`,
            () => {},
            { danger: true, confirmText: 'Entendido' }
          )
        } finally {
          setIsPlacingOrder(false)
        }
      },
      {
        danger: false,
        confirmText: 'Confirmar y pagar',
      }
    )
  }

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Stepper */}
        <div className="mx-auto max-w-5xl">
          <CheckoutStepper currentStep="confirmation" />
        </div>

        {/* Encabezado */}
        <div className="mt-10">
          <h1 className="font-poppins text-5xl font-bold text-black">
            Detalles de compra
          </h1>
          <p className="font-inter text-lg font-medium text-neutral-700">
            Verifica tu compra y cambia los detalles que desees
          </p>
        </div>

        {/* Contenido Principal */}
        <div className="mt-8 flex flex-col items-start gap-8 lg:flex-row">
          {/* Columna Izquierda: Detalles */}
          <div className="w-full flex-1 space-y-8">
            {/* Tarjeta de Dirección */}
            <div className="rounded-lg bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-roboto text-2xl font-bold text-black">
                    Enviar a: {address?.name || 'Usuario'}
                  </h3>
                  <p className="mt-2 font-inter text-base text-neutral-600">
                    {address?.street}, {address?.city}, {address?.state},{' '}
                    {address?.postal_code}
                  </p>
                  <Link
                    href="/checkout"
                    className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
                  >
                    Agregar instrucciones de compra
                  </Link>
                </div>
                <Link
                  href="/checkout"
                  className="flex-shrink-0 font-roboto text-lg font-bold text-blue-600 hover:underline"
                >
                  Cambiar
                </Link>
              </div>
            </div>

            {/* Tarjeta de Pago */}
            <div className="rounded-lg bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-roboto text-2xl font-bold text-black">
                    Pagando con {paymentMethodId === 'paypal' ? 'PayPal' : 'Tarjeta'}
                  </h3>
                  <p className="mt-2 font-inter text-base text-neutral-600">
                    {paymentMethodId?.startsWith('card_') 
                      ? `Tarjeta terminación ${paymentMethodId.slice(-4)}`
                      : 'Aprobación requerida'}
                  </p>
                </div>
                <Link
                  href="/checkout/payment"
                  className="flex-shrink-0 font-roboto text-lg font-bold text-blue-600 hover:underline"
                >
                  Cambiar
                </Link>
              </div>
            </div>
            
            {/* Lista de Productos */}
            <div className="rounded-lg bg-white p-6 shadow-2xl">
              <h2 className="border-b border-neutral-300 pb-4 font-poppins text-3xl font-semibold text-black">
                Tus productos elegidos
              </h2>
              <div className="mt-6 space-y-4">
                {cartItems.map(item => (
                  <ConfirmationProductCard 
                    key={item.cart_item_id}
                    item={item}
                    shippingMethod={shippingMethod}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* Columna Derecha: Resumen */}
          <div className="w-full lg:w-96">
            <CheckoutSummary
              onContinue={handleConfirmAndPay}
              buttonText="Confirmar y pagar"
              backLink="/checkout/payment"
              backText="← Volver a pago"
              showTerms={true}
              isLoading={isPlacingOrder}
            />
          </div>
        </div>
      </div>
    </div>
  )
}