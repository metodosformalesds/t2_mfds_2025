'use client'

import { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/useCartStore'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import CartItem from '@/components/cart/CartItem'
import OrderSummary from '@/components/cart/OrderSummary'
import RelatedProducts from '@/components/cart/RelatedProducts'
import { ShoppingCart } from 'lucide-react'

export default function CartPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { items, total_items, fetchCart } = useCartStore()

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

        {/* Contenido Principal */}
        <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:gap-4">
          
          {/* Columna Izquierda: Items - Expandida */}
          <div className="flex-1 rounded-lg bg-white p-4 shadow-2xl md:p-6">
            <h2 className="border-b border-neutral-300 pb-4 font-poppins text-3xl font-semibold text-black">
              Productos en tu carrito ({total_items})
            </h2>

            {items.length > 0 && (
              <div className="divide-y divide-neutral-200">
                {items.map((item) => (
                  <CartItem 
                    key={item.cart_item_id} 
                    item={item}
                  />
                ))}
              </div>
            )}

            {items.length === 0 && (
              <div className="flex h-64 flex-col items-center justify-center gap-4 text-neutral-500">
                <ShoppingCart size={48} />
                <p className="font-inter text-lg">Tu carrito está vacío.</p>
              </div>
            )}
          </div>

          {/* Columna Derecha: Resumen */}
          <OrderSummary items={items} />
        </div>

        {/* Productos Relacionados */}
        <div className="mt-12">
          <RelatedProducts />
        </div>
      </div>
    </div>
  )
}