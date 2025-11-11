'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SubscriptionCard() {
  const router = useRouter();

  const [subscriptionData] = useState({
    renewalDate: '15 de noviembre, 2025',
  });

  const handleManageBilling = () => {
    console.log('Administrar facturación');
    // TODO: Abrir modal o navegar a página de facturación
  };

  const handleViewPlans = () => {
    // Navegar a la página de planes
    router.push('/plans'); // Ajusta si el path es distinto
  };

  const handleCancelSubscription = () => {
    console.log('Cancelar suscripción');
    // TODO: Mostrar modal de confirmación
  };

  return (
    <div className="space-y-6">
      {/* Contenedor principal */}
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Encabezado principal */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-neutral-900/60 pb-6 md:flex-row md:items-center">
          <h1 className="font-poppins text-3xl font-bold text-neutral-900">
            Gestión de Suscripciones
          </h1>
        </div>

        {/* Card de Suscripción */}
        <div className="border-2 border-[#355E30] rounded-lg p-8 mt-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
            <div className="flex-1">
              <p className="font-poppins text-xl font-semibold text-neutral-900 mb-2">
                Gestión de Suscripción
              </p>
              <p className="text-sm text-gray-600 font-inter">
                Tu suscripción se renueva el {subscriptionData.renewalDate}
              </p>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <button
              onClick={handleManageBilling}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors font-inter"
            >
              Administrar Facturación
            </button>

            <button
              onClick={handleViewPlans}
              className="flex-1 px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors font-inter"
            >
              Ver Todos los Planes
            </button>
          </div>

          {/* Botón Cancelar */}
          <button
            onClick={handleCancelSubscription}
            className="w-full mt-4 px-6 py-2 text-red-600 hover:text-red-700 font-semibold text-sm font-inter"
          >
            Cancelar suscripción
          </button>
        </div>
      </div>
    </div>
  );
}
