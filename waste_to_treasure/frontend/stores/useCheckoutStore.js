import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Store de Zustand para manejar el estado del flujo de checkout.
 */
export const useCheckoutStore = create(
  persist(
    (set) => ({
      addressId: null,
      shippingMethod: null, // Guardamos el objeto entero
      paymentMethodId: null, // 'card_id_123', 'paypal', o 'tok_new_card'
      
      setAddress: (addressId) => set({ addressId }),
      setShippingMethod: (method) => set({ shippingMethod: method }),
      setPaymentMethod: (paymentMethodId) => set({ paymentMethodId }),
      
      clearCheckout: () => set({
        addressId: null,
        shippingMethod: null,
        paymentMethodId: null,
      }),
    }),
    {
      name: 'checkout-storage', // Nombre en localStorage
    }
  )
)