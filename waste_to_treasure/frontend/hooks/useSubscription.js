// Autor: Gabriel Florentino Reyes
// Fecha: 13-11-2025
// Descripción: Hook para gestionar la suscripción del usuario. Permite obtener la suscripción 
//              activa, crear o cambiar un plan, cancelarla, recargar información y verificar el 
//              estado del plan.

/**
 * Hook para gestionar la suscripción del usuario.
 * Proporciona funciones para obtener, crear y cancelar suscripciones.
 */

import { useState, useEffect, useCallback } from 'react'
import { subscriptionsService } from '@/lib/api/subscriptions'

export function useSubscription(autoLoad = true) {
  const [subscription, setSubscription] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Carga la suscripción activa desde la API
   */
  const fetchSubscription = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await subscriptionsService.getMySubscription()
      setSubscription(data)
      return data
    } catch (err) {
      // Si es 404, no es un error, simplemente no hay suscripción
      if (err.response?.status === 404) {
        setSubscription(null)
        setError(null)
        return null
      }
      setError(err.message || 'Error al cargar la suscripción')
      console.error('Error en fetchSubscription:', err)
      setSubscription(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Crea o cambia la suscripción
   * @param {number} planId - ID del plan
   * @param {string} paymentToken - Token de pago
   */
  const subscribe = useCallback(async (planId, paymentToken) => {
    setIsLoading(true)
    setError(null)

    try {
      const newSubscription = await subscriptionsService.createOrChangeSubscription({
        plan_id: planId,
        payment_token: paymentToken,
      })
      setSubscription(newSubscription)
      return newSubscription
    } catch (err) {
      setError(err.message || 'Error al crear la suscripción')
      console.error('Error en subscribe:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Cancela la suscripción activa
   */
  const cancelSubscription = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const cancelledSubscription = await subscriptionsService.cancelSubscription()
      setSubscription(cancelledSubscription)
      return cancelledSubscription
    } catch (err) {
      setError(err.message || 'Error al cancelar la suscripción')
      console.error('Error en cancelSubscription:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Recarga la suscripción actual
   */
  const refresh = useCallback(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // Cargar suscripción al montar el componente si autoLoad es true
  useEffect(() => {
    if (autoLoad) {
      fetchSubscription()
    }
  }, [autoLoad, fetchSubscription])

  /**
   * Verifica si el usuario tiene una suscripción activa
   */
  const hasActiveSubscription = useCallback(() => {
    return subscription?.status === 'ACTIVE'
  }, [subscription])

  /**
   * Obtiene el nombre del plan actual
   */
  const getPlanName = useCallback(() => {
    return subscription?.plan?.name || null
  }, [subscription])

  return {
    subscription,
    isLoading,
    error,
    fetchSubscription,
    subscribe,
    cancelSubscription,
    refresh,
    hasActiveSubscription,
    getPlanName,
  }
}