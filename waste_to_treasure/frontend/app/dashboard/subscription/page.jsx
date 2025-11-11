import SubscriptionCard from '@/components/dashboard/SubscriptionCard';

export const metadata = {
  title: 'Gestión de Suscripciones - Waste to Treasure',
  description: 'Administra tu plan y suscripción.',
};

export default function SubscriptionPage() {
  return (
    <div className="flex flex-col gap-6">
      <SubscriptionCard />
    </div>
  );
}