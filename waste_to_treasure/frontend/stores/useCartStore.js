import { create } from 'zustand'
import { cartService } from '@/lib/api/cart'

export const useCartStore = create((set, get) => ({
  items: [],
  total_items: 0,
  subtotal: '0.00',
  estimated_commission: '0.00',
  estimated_total: '0.00',
  has_unavailable_items: false,
  isLoading: false,
  error: null,

  _setCartState: (data) => {
    // Contar items únicos (diferentes productos), no la suma de cantidades
    const uniqueItemsCount = (data.items || []).length
    
    set({
      items: data.items || [],
      total_items: uniqueItemsCount,
      subtotal: data.subtotal || '0.00',
      estimated_commission: data.estimated_commission || '0.00',
      estimated_total: data.estimated_total || '0.00',
      has_unavailable_items: data.has_unavailable_items || false,
      isLoading: false,
      error: null,
    })
  },

  fetchCart: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await cartService.getCart()
      get()._setCartState(data)
      return data
    } catch (error) {
      // Si es 401, es porque no hay sesión - resetear carrito silenciosamente
      if (error.response?.status === 401) {
        set({
          items: [],
          total_items: 0,
          subtotal: '0.00',
          estimated_commission: '0.00',
          estimated_total: '0.00',
          has_unavailable_items: false,
          isLoading: false,
          error: null, // No mostrar error en páginas públicas
        })
        return null
      }
      
      // Otros errores sí deben mostrarse
      set({ isLoading: false, error: 'No se pudo cargar el carrito' })
      throw error
    }
  },

  addItem: async (listingId, quantity) => {
    set({ isLoading: true, error: null })
    try {
      const data = await cartService.addItem(listingId, quantity)
      get()._setCartState(data)
      return data
    } catch (error) {
      set({ isLoading: false, error: 'Error al agregar el item' })
      throw error
    }
  },

  updateItem: async (cartItemId, quantity) => {
    set({ isLoading: true, error: null })
    try {
      const data = await cartService.updateItem(cartItemId, quantity)
      get()._setCartState(data)
      return data
    } catch (error) {
      set({ isLoading: false, error: 'Error al actualizar el item' })
      throw error
    }
  },

  removeItem: async (cartItemId) => {
    set({ isLoading: true, error: null })
    try {
      const data = await cartService.removeItem(cartItemId)
      get()._setCartState(data)
      return data
    } catch (error) {
      set({ isLoading: false, error: 'Error al eliminar el item' })
      throw error
    }
  },

  clearCart: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await cartService.clearCart()
      get()._setCartState(data)
      return data
    } catch (error) {
      set({
        items: [],
        total_items: 0,
        subtotal: '0.00',
        estimated_commission: '0.00',
        estimated_total: '0.00',
        has_unavailable_items: false,
        isLoading: false,
        error: 'Error al limpiar el carrito',
      })
      throw error
    }
  },

  resetCart: () => {
    set({
      items: [],
      total_items: 0,
      subtotal: '0.00',
      estimated_commission: '0.00',
      estimated_total: '0.00',
      has_unavailable_items: false,
      isLoading: false,
      error: null,
    })
  },
}))