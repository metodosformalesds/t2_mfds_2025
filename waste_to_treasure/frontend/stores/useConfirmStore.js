import { create } from 'zustand'

/**
 * Store de Zustand para manejar un modal de confirmación global.
 */
export const useConfirmStore = create(set => ({
  isOpen: false,
  title: '',
  message: '',
  danger: true, // Por defecto es un modal de peligro (rojo)
  confirmText: null, // <-- AÑADIDO: Texto opcional para el botón de confirmar
  onConfirm: () => {},
  onCancel: () => {},

  /**
   * Abre el modal de confirmación.
   * @param {string} title - El título del modal.
   * @param {string} message - El mensaje de confirmación.
   * @param {Function} onConfirm - La función a ejecutar si se confirma.
   * @param {Object} [options] - Opciones adicionales
   * @param {Function} [options.onCancel] - (Opcional) La función a ejecutar si se cancela.
   * @param {boolean} [options.danger] - (Opcional) Si el botón de confirmación es rojo. (default: true)
   * @param {string} [options.confirmText] - (Opcional) Texto para el botón de confirmación.
   */
  open: (title, message, onConfirm, options = {}) => {
    const { onCancel = () => {}, danger = true, confirmText = null } = options
    set({
      isOpen: true,
      title,
      message,
      onConfirm,
      onCancel,
      danger,
      confirmText, // <-- AÑADIDO
    })
  },

  /**
   * Cierra el modal y resetea su estado.
   */
  close: () =>
    set({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
      onCancel: () => {},
      danger: true,
      confirmText: null, // <-- AÑADIDO
    }),
}))