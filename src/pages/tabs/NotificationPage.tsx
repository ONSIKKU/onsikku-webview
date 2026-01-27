import NotificationList from '@/components/notification/NotificationList';
import NotificationSummary from '@/components/notification/NotificationSummary';

export default function NotificationPage() {
  return (
    <div className="min-h-screen bg-orange-50">
      <div className="gap-5 px-5 pb-10">
        <NotificationSummary />
        <NotificationList />
      </div>
    </div>
  );
}
