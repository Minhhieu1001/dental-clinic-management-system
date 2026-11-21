import React from 'react';
import NotificationCenter from './NotificationCenter';

export default function PatientNotifications() {
  return (
    <NotificationCenter
      role="PATIENT"
      pageTitle="Thông báo & Nhắc lịch nha khoa"
      pageDescription="Theo dõi lịch hẹn khám răng, lịch tái khám định kỳ, hóa đơn thanh toán và các cập nhật mới nhất từ Crown Dental."
    />
  );
}
