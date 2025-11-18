/**
 * Autor: Alejandro Campa Alonso 215833
 * Componente: SubscriptionCard
 * Descripción: tarjeta que muestra estado de suscripción actual con detalles de plan, fecha de próxima renovación, opciones para gestionar facturación y cancelar suscripción
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { useConfirmStore } from '@/stores/useConfirmStore';
import { Loader2, AlertCircle, CheckCircle2, CreditCard, Calendar } from 'lucide-react';

export default function SubscriptionCard() {
  const router = useRouter();
  const { subscription, isLoading, error, cancelSubscription, refresh } = useSubscription();
  const openConfirmModal = useConfirmStore(state => state.open);

  const [isCancelling, setIsCancelling] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleManageBilling = () => {
    console.log('Administrar facturación');
    // TODO: Abrir modal o navegar a Stripe Billing Portal
    // Si tienes un endpoint para crear una sesión de Billing Portal:
    // router.push('/api/stripe/create-billing-session')
  };

  const handleViewPlans = () => {
    // Navegar a la página de selección de planes del flujo de suscripción
    router.push('/dashboard/subscription/select');
  };

  const handleCancelSubscription = async () => {
    openConfirmModal(
      '¿Cancelar Suscripción?',
      '¿Estás seguro de que deseas cancelar tu suscripción? Perderás acceso a las funciones premium al final del período de facturación actual.',
      async () => {
        setIsCancelling(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
          await cancelSubscription();
          setSuccessMessage('Suscripción cancelada exitosamente');

          // Recargar para mostrar el estado actualizado
          setTimeout(() => {
            setSuccessMessage('');
            refresh();
          }, 3000);
        } catch (err) {
          setErrorMessage(err.message || 'Error al cancelar la suscripción');
          console.error('Error al cancelar:', err);
        } finally {
          setIsCancelling(false);
        }
      },
      { danger: true, confirmText: 'Sí, cancelar suscripción' }
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getOneYearFromStart = (startDateString) => {
    if (!startDateString) return 'N/A';
    const startDate = new Date(startDateString);
    const oneYearLater = new Date(startDate);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    return formatDate(oneYearLater.toISOString());
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: { color: 'bg-green-100 text-green-700 border-green-300', label: 'Activa' },
      CANCELLED: { color: 'bg-red-100 text-red-700 border-red-300', label: 'Cancelada' },
      EXPIRED: { color: 'bg-gray-100 text-gray-700 border-gray-300', label: 'Expirada' },
    };
    return badges[status] || { color: 'bg-gray-100 text-gray-700 border-gray-300', label: status };
  };


  // Mostrar loader mientras carga
  if (isLoading && !subscription) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contenedor principal */}
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Mensajes de éxito/error */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-inter">{successMessage}</span>
          </div>
        )}

        {(errorMessage || error) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700 font-inter">{errorMessage || error}</span>
          </div>
        )}

        {/* Encabezado principal */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-neutral-900/60 pb-6 md:flex-row md:items-center">
          <h1 className="font-poppins text-3xl font-bold text-neutral-900">
            Gestión de Suscripciones
          </h1>
        </div>

        {/* Contenido según estado de suscripción */}
        {!subscription || subscription.status === 'EXPIRED' || subscription.status === 'CANCELLED' ? (
          // Sin suscripción activa, expirada o cancelada
          <div className="mt-6 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2 font-poppins">
              Este es tu plan actual
            </h3>
            <p className="text-gray-600 mb-6 font-inter">
              Actualmente tienes acceso al plan gratuito. Suscríbete para desbloquear funciones premium
            </p>
            <button
              onClick={handleViewPlans}
              className="px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors font-inter"
            >
              Ver Planes Disponibles
            </button>
          </div>
        ) : (
          // Suscripción activa
          <div className="border-2 border-[#355E30] rounded-lg p-8 mt-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-poppins text-xl font-semibold text-neutral-900">
                    {subscription.plan?.name || 'Plan Activo'}
                  </h3>
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(subscription.status).color}`}>
                    {getStatusBadge(subscription.status).label}
                  </span>
                </div>

                {subscription.start_date && (
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    <p className="text-sm font-inter">
                      Tu suscripción anual se renueva el {getOneYearFromStart(subscription.start_date)}
                    </p>
                  </div>
                )}

                {/* Detalles del plan */}
                {subscription.plan && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary-500 font-poppins">
                        ${subscription.plan.price}
                      </span>
                      <span className="text-sm text-gray-500 font-inter">
                        / {subscription.plan.billing_cycle === 'MONTHLY' ? 'mes' : 'año'}
                      </span>
                    </div>
                    {subscription.plan.description && (
                      <p className="text-sm text-gray-600 font-inter">
                        {subscription.plan.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <button
                onClick={handleViewPlans}
                className="flex-1 px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors font-inter"
              >
                Ver Otros Planes
              </button>
            </div>

            {/* Botón Cancelar */}
            <button
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="w-full mt-4 px-6 py-2 text-red-600 hover:text-red-700 font-semibold text-sm font-inter disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? 'Cancelando...' : 'Cancelar suscripción'}
            </button>
          </div>
        )}

        {/* Información adicional */}
        {subscription && subscription.status === 'ACTIVE' && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1 font-inter">
                  Información sobre tu suscripción
                </h4>
                <p className="text-sm text-blue-700 font-inter">
                  Tu suscripción se renovará automáticamente. Puedes cancelarla en cualquier momento 
                  sin cargos adicionales. Los cambios entrarán en vigor al final del período de facturación actual.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}