import React from 'react';
import NotificationCenter from './NotificationCenter';

export default function DentistNotifications() {
  return (
    <div className="w-full">
      <NotificationCenter
        role="DENTIST"
        pageTitle="Thông báo bác sĩ nha khoa"
        pageDescription="Cập nhật danh sách bệnh nhân vừa check-in, lịch hẹn mới phân công, chỉ định điều trị và kết quả chẩn đoán."
      />
    </div>
  );
}
