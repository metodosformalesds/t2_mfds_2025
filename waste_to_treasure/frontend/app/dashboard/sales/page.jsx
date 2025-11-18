// Autor: Gabriel Florentino Reyes
// Fecha: 12-11-2025
// Descripción: Esta página permite al usuario ver y gestionar todas las ventas que ha realizado. 
//              Utiliza el componente SalesList para mostrar cada venta, incluyendo detalles como estado, 
//              cantidad y fecha de la transacción.

import SalesList from '@/components/dashboard/SalesList';

export const metadata = {
  title: 'Mis Ventas - Waste to Treasure',
  description: 'Gestiona y visualiza tus ventas realizadas.',
};

export default function SalesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-black text-3xl font-poppins font-semibold">
          Mis Ventas
        </h1>
        <p className="text-gray-600 font-inter mt-2">
          Gestiona y visualiza todas tus ventas realizadas
        </p>
      </div>
      <SalesList />
    </div>
  );
}