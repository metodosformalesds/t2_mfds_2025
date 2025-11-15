import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Store de Zustand para manejar el estado del flujo de checkout.
 */
export const useCheckoutStore = create(
  persist(
    (set) => ({
      addressId: null,
      shippingMethod: null, 
      paymentMethodId: null, // 'pm_123', 'pm_456', etc.
      
      // --- INICIO DE MODIFICACIÓN ---
      // Ahora solo guardamos un objeto de tarjeta, no un array
      savedCard: null, // { id: "pm_123", last4: "4242" }
      // --- FIN DE MODIFICACIÓN ---
      
      setAddress: (addressId) => set({ addressId }),
      setShippingMethod: (method) => set({ shippingMethod: method }),
      setPaymentMethod: (paymentMethodId) => set({ paymentMethodId }),

      // --- INICIO DE MODIFICACIÓN ---
      /**
       * Guarda (o reemplaza) la tarjeta validada
       * @param {object} newCard - { id: "pm_123", last4: "4242" }
       */
      setSavedCard: (newCard) => set({
        savedCard: newCard
      }),

      /**
       * Elimina la tarjeta guardada y la selección
       */
      clearSavedCard: () => set({
        savedCard: null,
        paymentMethodId: null // También deseleccionamos
      }),
      // --- FIN DE MODIFICACIÓN ---
      
      clearCheckout: () => set({
        addressId: null,
        shippingMethod: null,
        paymentMethodId: null,
        // No limpiamos la tarjeta guardada al finalizar el checkout
      }),
    }),
    {
      name: 'checkout-storage', // Nombre en localStorage
    }
  )
)