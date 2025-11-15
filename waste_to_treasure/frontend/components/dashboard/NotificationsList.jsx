'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { 
  Bell, 
  Loader2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  DollarSign,
  ShoppingBag,
  Check,
  XCircle,
  Star,
  AlertTriangle,
  CheckCheck
} from 'lucide-react';

export default function NotificationsList() {
  const { 
    notifications, 
    isLoading, 
    error, 
    pagination, 
    goToPage, 
    nextPage, 
    prevPage,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  const getNotificationConfig = (type) => {
    const configs = {
      'ORDER_CREATED': {
        icon: ShoppingBag,
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      'ORDER_COMPLETED': {
        icon: CheckCircle,
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600',
      },
      'LISTING_APPROVED': {
        icon: Check,
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600',
      },
      'LISTING_REJECTED': {
        icon: XCircle,
        bgColor: 'bg-red-100',
        iconColor: 'text-red-600',
      },
      'NEW_REVIEW': {
        icon: Star,
        bgColor: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
      },
      'LOW_STOCK': {
        icon: AlertTriangle,
        bgColor: 'bg-orange-100',
        iconColor: 'text-orange-600',
      },
      'SALE': {
        icon: DollarSign,
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600',
      },
      'default': {
        icon: Bell,
        bgColor: 'bg-gray-100',
        iconColor: 'text-gray-600',
      }
    };
    return configs[type] || configs.default;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Hace unos segundos';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
    
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.notification_id);
    }
    
    // Determinar la URL correcta según el tipo de notificación y link_url
    let targetUrl = notification.link_url;
    
    // Ajustar paths según el tipo de notificación
    if (targetUrl) {
      // Convertir paths antiguos al formato correcto
      if (targetUrl.startsWith('/my-purchases/')) {
        targetUrl = targetUrl.replace('/my-purchases/', '/dashboard/purchases/');
      } else if (targetUrl.startsWith('/my-sales/')) {
        targetUrl = targetUrl.replace('/my-sales/', '/dashboard/sales/');
      } else if (targetUrl.startsWith('/listings/')) {
        targetUrl = targetUrl.replace('/listings/', '/dashboard/publicaciones/');
      }
      
      // Navegar
      window.location.href = targetUrl;
    }
  };

  // Mostrar loader mientras carga
  if (isLoading && notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header con estadísticas */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold font-poppins text-gray-900">
              Todas las Notificaciones
            </h2>
            <p className="text-sm text-gray-600 font-inter mt-1">
              {pagination.unreadCount > 0 ? (
                <span className="font-semibold text-primary-600">
                  {pagination.unreadCount} sin leer
                </span>
              ) : (
                'No tienes notificaciones sin leer'
              )}
            </p>
          </div>
          {pagination.unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full hover:bg-primary-200 transition-colors border border-primary-300 font-inter"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700 font-inter">{error}</span>
        </div>
      )}

      {/* Lista de notificaciones */}
      <div className="divide-y divide-gray-100">
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const config = getNotificationConfig(notification.notification_type);
            const Icon = config.icon;

            return (
              <div
                key={notification.notification_id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-6 transition-colors cursor-pointer ${
                  notification.is_read 
                    ? 'hover:bg-gray-50' 
                    : 'bg-blue-50 hover:bg-blue-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${config.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className={`font-inter text-base mb-1 ${
                          notification.is_read ? 'text-gray-700' : 'text-gray-900 font-semibold'
                        }`}>
                          {notification.content}
                        </p>
                        <p className="font-inter text-sm text-gray-500">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      
                      {/* Indicador de no leída */}
                      {!notification.is_read && (
                        <div className="flex-shrink-0">
                          <span className="w-3 h-3 bg-primary-500 rounded-full block"></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="font-inter text-gray-500 font-semibold text-lg">
              No tienes notificaciones
            </p>
            <p className="font-inter text-gray-400 text-sm mt-2">
              Cuando tengas nuevas notificaciones, aparecerán aquí
            </p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {notifications.length > 0 && pagination.totalPages > 1 && (
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 font-inter">
              Mostrando{' '}
              <span className="font-semibold">{((pagination.page - 1) * pagination.pageSize) + 1}</span>
              {' '}-{' '}
              <span className="font-semibold">
                {Math.min(pagination.page * pagination.pageSize, pagination.total)}
              </span>
              {' '}de{' '}
              <span className="font-semibold">{pagination.total}</span>
              {' '}notificaciones
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevPage}
                disabled={pagination.page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 rounded-lg font-inter text-sm font-semibold transition-colors ${
                        pagination.page === pageNum
                          ? 'bg-primary-500 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={nextPage}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
