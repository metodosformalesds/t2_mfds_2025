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