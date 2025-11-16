'use client'

import { useEffect, useMemo } from 'react'
import { useCartStore } from '@/stores/useCartStore'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import CartItem from '@/components/cart/CartItem'
import OrderSummary from '@/components/cart/OrderSummary'
import RelatedProducts from '@/components/cart/RelatedProducts'
import { ShoppingCart, AlertTriangle } from 'lucide-react'

export default function CartPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { items, total_items, fetchCart, has_unavailable_items } = useCartStore()

  useEffect(() => {
    // Proteger la ruta del carrito
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login?redirect=/cart')
    }
    
    // Cargar el carrito si el usuario está autenticado
    if (!isAuthLoading && isAuthenticated) {
      fetchCart()
    }
  }, [isAuthenticated, isAuthLoading, fetchCart, router])

  // Separar items disponibles y no disponibles
  const { availableItems, unavailableItems } = useMemo(() => {
    const available = []
    const unavailable = []
    
    items.forEach(item => {
      // Verificar si el producto está disponible
      const isAvailable = item.listing_is_available && 
                          (item.listing_available_quantity ?? 0) > 0
      
      if (isAvailable) {
        available.push(item)
      } else {
        unavailable.push(item)
      }
    })
    
    return { availableItems: available, unavailableItems: unavailable }
  }, [items])

  return (
    <div className="min-h-screen bg-neutral-100 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="font-poppins text-5xl font-bold text-black">
            Carrito
          </h1>
          <p className="font-inter text-lg font-medium text-neutral-700">
            Revisa tus productos antes de continuar con la compra
          </p>
        </div>

        {/* Alerta de productos sin stock */}
        {unavailableItems.length > 0 && (
          <div className="mb-6 rounded-lg bg-yellow-50 border-2 border-yellow-400 p-4 shadow-md">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-poppins text-lg font-semibold text-yellow-800">
                  Productos sin stock
                </h3>
                <p className="font-inter text-sm text-yellow-700 mt-1">
                  Algunos productos en tu carrito ya no están disponibles. Elimínalos para continuar con tu compra.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contenido Principal */}
        <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:gap-4">
          
          {/* Columna Izquierda: Items - Expandida */}
          <div className="flex-1 rounded-lg bg-white p-4 shadow-2xl md:p-6">
            <h2 className="border-b border-neutral-300 pb-4 font-poppins text-3xl font-semibold text-black">
              Productos en tu carrito ({total_items})
            </h2>

            {items.length > 0 && (
              <>
                {/* Items disponibles */}
                {availableItems.length > 0 && (
                  <div className="divide-y divide-neutral-200">
                    {availableItems.map((item) => (
                      <CartItem 
                        key={item.cart_item_id} 
                        item={item}
                      />
                    ))}
                  </div>
                )}

                {/* Items no disponibles - Sección separada con estilo diferente */}
                {unavailableItems.length > 0 && (
                  <div className="mt-6 pt-6 border-t-2 border-red-200">
                    <h3 className="font-poppins text-xl font-semibold text-red-600 mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Sin Stock ({unavailableItems.length})
                    </h3>
                    <div className="divide-y divide-neutral-200 opacity-60">
                      {unavailableItems.map((item) => (
                        <CartItem 
                          key={item.cart_item_id} 
                          item={item}
                          isUnavailable={true}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {items.length === 0 && (
              <div className="flex h-64 flex-col items-center justify-center gap-4 text-neutral-500">
                <ShoppingCart size={48} />
                <p className="font-inter text-lg">Tu carrito está vacío.</p>
              </div>
            )}
          </div>

          {/* Columna Derecha: Resumen */}
          <OrderSummary 
            items={availableItems}
            hasUnavailableItems={unavailableItems.length > 0}
          />
        </div>

        {/* Productos Relacionados */}
        <div className="mt-12">
          <RelatedProducts />
        </div>
      </div>
    </div>
  )
}