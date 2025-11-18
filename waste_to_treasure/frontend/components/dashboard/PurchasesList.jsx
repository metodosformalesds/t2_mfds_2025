/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: PurchasesList
 * Descripción: tabla paginada de compras del usuario con información de orden, estado, fechas y acciones para ver detalles de cada compra
 */

// Autor: Gabriel Florentino Reyes
// Fecha: 12-11-2025
// Descripción: Descripción: Componente que muestra la lista de compras del usuario con 
//              paginación, manejo de estados (cargando, error), visualización de detalles de cada compra y 
//              representación del estado de cada pedido con colores y etiquetas.


'use client';

import { usePurchases } from '@/hooks/usePurchases';
import { ShoppingBag, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PurchasesList() {
  const { purchases, isLoading, error, pagination, goToPage, nextPage, prevPage } = usePurchases();

  const handleViewDetails = (orderId) => {
    window.location.href = `/dashboard/purchases/${orderId}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Mostrar loader mientras carga
  if (isLoading && purchases.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700 font-inter">{error}</span>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Pedido ID
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Productos
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Total
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Fecha
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 font-inter">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {purchases.length > 0 ? (
              purchases.map((order) => (
                <tr key={order.order_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-gray-700 font-inter font-semibold">
                    #{order.order_id}
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-inter">
                    {order.order_items?.length || 0} producto(s)
                  </td>
                  <td className="py-4 px-4 text-gray-700 font-inter font-semibold">
                    ${typeof order.total_amount === 'number' ? order.total_amount.toFixed(2) : parseFloat(order.total_amount || 0).toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-gray-500 font-inter text-sm">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleViewDetails(order.order_id)}
                      className="px-6 py-2 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full hover:bg-indigo-200 transition-colors border border-indigo-300 font-inter"
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <ShoppingBag className="w-12 h-12" />
                    <p className="font-inter font-semibold">
                      No tienes compras registradas
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {purchases.length > 0 && (
        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-600 font-inter">
            Mostrando{' '}
            <span className="font-semibold">{((pagination.page - 1) * pagination.pageSize) + 1}</span>
            {' '}-{' '}
            <span className="font-semibold">
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </span>
            {' '}de{' '}
            <span className="font-semibold">{pagination.total}</span>
            {' '}compras
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
      )}
    </div>
  );
}