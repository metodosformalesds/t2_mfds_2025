// Autor: Gabriel Florentino Reyes
// Fecha: 12-11-2025
// Descripción: Esta página muestra el historial de compras y pedidos del usuario en el dashboard. 
//              Utiliza el componente PurchasesList para listar todas las compras realizadas, permitiendo al usuario 
//              revisar el estado y detalles de cada pedido.

import PurchasesList from '@/components/dashboard/PurchasesList';

export const metadata = {
  title: 'Mis Compras - Waste to Treasure',
  description: 'Historial de compras y pedidos realizados.',
};

export default function PurchasesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-black text-3xl font-poppins font-semibold">
          Mis Compras
        </h1>
        <p className="text-gray-600 font-inter mt-2">
          Historial de todas tus compras y pedidos realizados
        </p>
      </div>
      <PurchasesList />
    </div>
  );
}