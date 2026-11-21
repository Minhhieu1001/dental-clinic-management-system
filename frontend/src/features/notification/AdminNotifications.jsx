import React from 'react';
import NotificationCenter from './NotificationCenter';

export default function AdminNotifications() {
  return (
    <NotificationCenter
      role="ADMIN"
      pageTitle="Thông báo quản trị hệ thống"
      pageDescription="Theo dõi toàn bộ thông báo hệ thống, cảnh báo kho dược, giao dịch thanh toán và nhân sự."
    />
  );
}
