/**
 * Hook para obtener todos los datos del dashboard.
 * Combina información de listings, orders, sales y notificaciones.
 */

import { useState, useEffect, useCallback } from 'react'
import { listingsService } from '@/lib/api/listings'
import { ordersService } from '@/lib/api/orders'
import { notificationsService } from '@/lib/api/notifications'

export function useDashboardData() {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalSales: 0,
      activeListings: 0,
      receivedOrders: 0,
      newNotifications: 0,
    },
    pendingListings: [],
    lowStockListings: [],
    topProducts: [],
    recentActivity: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Carga todos los datos del dashboard
   */
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Llamadas paralelas para mejor rendimiento
      const [listingsData, salesData, ordersData, notificationsData] = await Promise.all([
        listingsService.getMyListings({ page: 1, page_size: 100 }), // Mis publicaciones
        ordersService.getMySales({ skip: 0, limit: 10 }), // Mis ventas
        ordersService.getMyPurchases({ skip: 0, limit: 10 }), // Mis compras
        notificationsService.getMyNotifications({ skip: 0, limit: 10 }), // Notificaciones
      ])

      // Procesar estadísticas
      const activeListings = listingsData.items.filter(l => l.status === 'ACTIVE')
      const pendingListings = listingsData.items.filter(l => l.status === 'PENDING')
      const lowStockListings = activeListings.filter(l => l.quantity < 5) // Umbral de stock bajo

      // Calcular total de ventas (últimos 30 días)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentSales = salesData.items.filter(sale => {
        const saleDate = new Date(sale.created_at)
        return saleDate >= thirtyDaysAgo && sale.status !== 'CANCELLED'
      })
      
      const totalSales = recentSales.reduce((sum, sale) => {
        const amount = typeof sale.total_amount === 'number' 
          ? sale.total_amount 
          : parseFloat(sale.total_amount || 0)
        return sum + amount
      }, 0)

      // Obtener órdenes recientes como "pedidos recibidos"
      const receivedOrders = salesData.items.filter(
        sale => sale.status === 'PENDING' || sale.status === 'PROCESSING'
      ).length

      // Top productos (por cantidad de ventas)
      const productSales = {}
      salesData.items.forEach(sale => {
        sale.order_items?.forEach(item => {
          const key = item.listing?.listing_id
          if (!key) return // Skip si no hay listing
          
          if (!productSales[key]) {
            productSales[key] = {
              listing_id: item.listing.listing_id,
              title: item.listing.title || 'Producto',
              totalSales: 0,
              totalRevenue: 0,
              image_url: item.listing.primary_image_url,
            }
          }
          
          const price = typeof item.price_at_purchase === 'number' 
            ? item.price_at_purchase 
            : parseFloat(item.price_at_purchase || 0)
            
          productSales[key].totalSales += item.quantity
          productSales[key].totalRevenue += price * item.quantity
        })
      })

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5)

      // Actividad reciente (combinar notificaciones y ventas recientes)
      const recentActivity = []
      
      // Agregar ventas recientes
      recentSales.slice(0, 3).forEach(sale => {
        recentActivity.push({
          id: `sale-${sale.order_id}`,
          type: 'sale',
          text: `¡Nueva Venta! Orden #${sale.order_id}`,
          time: formatTimeAgo(sale.created_at),
          icon: 'dollar',
          link_url: `/dashboard/sales/${sale.order_id}`
        })
      })

      // Agregar notificaciones recientes
      notificationsData.items.slice(0, 3).forEach(notification => {
        recentActivity.push({
          id: `notif-${notification.notification_id}`,
          type: notification.notification_type,
          text: notification.content || notification.message,
          time: formatTimeAgo(notification.created_at),
          icon: getNotificationIcon(notification.notification_type),
          isRead: notification.is_read,
          link_url: notification.link_url
        })
      })

      // Ordenar por fecha (más recientes primero)
      recentActivity.sort((a, b) => {
        // Extraer timestamp de cada item basado en su ID
        const getTimestamp = (item) => {
          if (item.id.startsWith('sale-')) {
            const sale = recentSales.find(s => s.order_id === parseInt(item.id.split('-')[1]))
            return sale ? new Date(sale.created_at).getTime() : 0
          } else {
            const notif = notificationsData.items.find(n => n.notification_id === parseInt(item.id.split('-')[1]))
            return notif ? new Date(notif.created_at).getTime() : 0
          }
        }
        return getTimestamp(b) - getTimestamp(a)
      })

      setDashboardData({
        stats: {
          totalSales: typeof totalSales === 'number' ? totalSales.toFixed(2) : '0.00',
          activeListings: activeListings.length,
          receivedOrders,
          newNotifications: notificationsData.unread_count || 0,
        },
        pendingListings: pendingListings.slice(0, 3),
        lowStockListings: lowStockListings.slice(0, 3),
        topProducts,
        recentActivity: recentActivity.slice(0, 5),
      })
    } catch (err) {
      setError(err.message || 'Error al cargar los datos del dashboard')
      console.error('Error en fetchDashboardData:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    dashboardData,
    isLoading,
    error,
    refresh: fetchDashboardData,
  }
}

// Funciones auxiliares
function formatTimeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return 'hace unos segundos'
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`
  if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`
  return date.toLocaleDateString('es-MX')
}

function getNotificationIcon(type) {
  const icons = {
    'ORDER_CREATED': 'shopping-bag',
    'ORDER_COMPLETED': 'check-circle',
    'LISTING_APPROVED': 'check',
    'LISTING_REJECTED': 'x-circle',
    'NEW_REVIEW': 'star',
    'LOW_STOCK': 'alert-triangle',
  }
  return icons[type] || 'bell'
}