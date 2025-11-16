'use client';

import NotificationsList from '@/components/dashboard/NotificationsList';

export default function NotificationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-poppins text-neutral-900">
          Notificaciones
        </h1>
        <p className="text-gray-600 font-inter mt-2">
          Mantente al día con todas tus notificaciones
        </p>
      </div>
      
      <NotificationsList />
    </div>
  );
}
