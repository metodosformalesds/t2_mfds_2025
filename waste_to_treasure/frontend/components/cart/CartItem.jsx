'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import QuantitySelector from './QuantitySelector'
import { useCartStore } from '@/stores/useCartStore'

// Componente Toast mejorado
function Toast({ message, type = 'info', onClose, unit = '' }) {
  // Auto-cerrar usando useEffect (corregir uso previo de useState)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof onClose === 'function') onClose()
    }, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = {
    success: 'bg-primary-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-primary-500',
  }[type]

  const IconComponent = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: AlertCircle,
  }[type]

  const node = (
    <div className={`fixed top-6 right-6 ${bgColor} rounded-xl p-5 flex items-center gap-4 shadow-2xl z-[9999] animate-in fade-in slide-in-from-right max-w-sm`} role="status" aria-live="polite">
      <IconComponent size={28} className="text-white flex-shrink-0" />
      <div className="flex flex-col gap-1">
        <p className="text-white font-inter font-bold text-base">{message}</p>
        {unit && <p className="text-white/90 font-inter text-sm">{unit}</p>}
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(node, document.body)
  }

  return null
}

export default function CartItem({ item }) {
  const { updateItem, removeItem, fetchCart } = useCartStore()
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState(null)
  const [toast, setToast] = useState(null)
  const debounceTimerRef = useRef(null)

  const quantityUnit = item.listing_price_unit || 'unidades'

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  // Limpiar debounce timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleQuantityChange = (newQuantity) => {
    // Si el valor no cambió realmente, no hacer nada
    if (newQuantity === item.quantity) {
      return
    }

    if (isUpdating) return
    
    // Validar si se intenta agregar más de lo disponible
    if (newQuantity > item.listing_available_quantity) {
      showToast(
        `Solo hay ${item.listing_available_quantity} ${quantityUnit} disponibles para "${item.listing_title}".`,
        'warning'
      )
      return
    }

    // Limpiar debounce anterior si existe
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    const oldQuantity = item.quantity
    const difference = Math.abs(newQuantity - oldQuantity)
    const displayDifference = Math.round(difference)

    // Debounce: esperar 500ms antes de hacer la petición
    debounceTimerRef.current = setTimeout(async () => {
      setIsUpdating(true)
      setUpdateError(null)
      try {
        await updateItem(item.cart_item_id, newQuantity)
        
        // Mostrar notificación personalizada con producto y cantidad
        if (newQuantity > oldQuantity) {
          showToast(
            `Se añadieron ${displayDifference} ${quantityUnit} a "${item.listing_title}".`,
            'success'
          )
        } else if (newQuantity < oldQuantity) {
          showToast(
            `Se quitaron ${displayDifference} ${quantityUnit} de "${item.listing_title}".`,
            'info'
          )
        }
      } catch (err) {
          console.error('Error actualizando cantidad:', err)
          showToast(`No se pudo actualizar la cantidad de "${item.listing_title}". Intenta de nuevo.`, 'error')
          setUpdateError('Error al actualizar cantidad')
          setTimeout(() => setUpdateError(null), 2000)
        } finally {
        setIsUpdating(false)
      }
    }, 500)
  }

  const handleRemove = async () => {
    if (isUpdating) return
    setIsUpdating(true)
    setUpdateError(null)
    try {
      // Mostrar notificación primero
      showToast(`"${item.listing_title}" eliminado del carrito`, 'info')
      
      // Esperar un poco para asegurar que se vea el toast antes de actualizar la UI
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Luego remover y actualizar
      await removeItem(item.cart_item_id)
      await fetchCart()
    } catch (err) {
      console.error('Error eliminando item:', err)
      showToast(`No se pudo eliminar "${item.listing_title}". Intenta de nuevo.`, 'error')
      setUpdateError('Error al eliminar item')
      setTimeout(() => setUpdateError(null), 2000)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex w-full items-center gap-4 border-b border-neutral-200 py-6 last:border-b-0 opacity-100 disabled:opacity-50" style={{ opacity: isUpdating ? 0.6 : 1 }}>
      <div className="relative h-24 w-24 flex-shrink-0 md:h-36 md:w-48">
        <Image
          src={item.listing_image_url || 'https://via.placeholder.com/190x150'}
          alt={item.listing_title || 'Imagen de producto'}
          layout="fill"
          objectFit="cover"
          className="rounded-lg border border-neutral-300"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 space-y-1">
          <h3 className="font-roboto text-1xl font-bold text-black">
            {item.listing_title}
          </h3>
          <p className="font-inter text-base font-medium text-neutral-600">
            {item.listing_description || 'Material reciclado'}
          </p>
          <p className="font-inter text-sm font-small text-neutral-600">
            Tu cantidad: {item.quantity} {quantityUnit}
          </p>
          <p className="font-inter text-sm font-small text-primary-500">
            Disponible: <span className="font-bold text-primary-500">{item.listing_available_quantity} {quantityUnit}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-roboto text-xl font-bold text-black">
                ${parseFloat(item.listing_price).toFixed(2)}
                <span className="font-inter text-sm font-medium text-neutral-600">
                  {" "}
                  / {quantityUnit}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <QuantitySelector
              quantity={item.quantity}
              onChange={handleQuantityChange}
              maxQuantity={item.listing_available_quantity}
              disabled={isUpdating}
              unit={quantityUnit}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleRemove}
        disabled={isUpdating}
        className="ml-4 flex-shrink-0 p-2 text-neutral-500 hover:text-red-600 disabled:opacity-50"
        aria-label="Eliminar item"
      >
        <Trash2 size={24} />
      </button>

      {updateError && (
        <div className="absolute bottom-0 left-0 text-red-500 font-inter text-sm">
          {updateError}
        </div>
      )}
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}