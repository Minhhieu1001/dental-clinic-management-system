import React from 'react';
import NotificationCenter from './NotificationCenter';

export default function EmployeeNotifications() {
  return (
    <NotificationCenter
      role="EMPLOYEE"
      pageTitle="Thông báo nhân viên & Lễ tân"
      pageDescription="Theo dõi diễn biến lịch hẹn, yêu cầu đặt lịch mới, tiếp nhận bệnh nhân và các thông báo vận hành phòng khám."
    />
  );
}
