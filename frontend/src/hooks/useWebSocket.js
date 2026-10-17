import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../store/authStore';

export function useWebSocket(
    onAppointmentRealtime,
    onNotificationRealtime,
    onRequestRealtime,
    onPaymentRealtime
) {
    const clientRef = useRef(null);

    useEffect(() => {
        const currentUser = useAuthStore.getState().user;
        const employeeId = currentUser?.employeeId || currentUser?.id || null;

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('WebSocket STOMP Connected!');

                // 1. Subscribe nhận thông báo cập nhật lịch hẹn chung
                client.subscribe('/topic/appointments', (message) => {
                    const payload = JSON.parse(message.body);
                    if (onAppointmentRealtime) onAppointmentRealtime(payload);
                });

                // 2. Subscribe nhận thông báo riêng của User hiện tại (Unicast)
                client.subscribe('/user/queue/notifications', (message) => {
                    const payload = JSON.parse(message.body);
                    if (onNotificationRealtime) onNotificationRealtime(payload);
                });

                // 3. Subscribe nhận thông báo chung (Broadcast topic)
                client.subscribe('/topic/notifications', (message) => {
                    const payload = JSON.parse(message.body);
                    if (onNotificationRealtime) onNotificationRealtime(payload);
                });

                // 4. Subscribe nhận yêu cầu đặt lịch hẹn mới từ Web (Online Requests)
                client.subscribe('/topic/appointment-requests', (message) => {
                    const payload = JSON.parse(message.body);
                    if (onRequestRealtime) onRequestRealtime(payload);
                });

                // 5. Subscribe nhận thông báo thanh toán thành công RIÊNG (Unicast Private)
                client.subscribe('/user/queue/payments', (message) => {
                    const payload = JSON.parse(message.body);
                    if (onPaymentRealtime) onPaymentRealtime(payload);
                });

                if (employeeId) {
                    client.subscribe(`/topic/payments/${employeeId}`, (message) => {
                        const payload = JSON.parse(message.body);
                        if (onPaymentRealtime) onPaymentRealtime(payload);
                    });
                }
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) clientRef.current.deactivate();
        };
    }, [onAppointmentRealtime, onNotificationRealtime, onRequestRealtime, onPaymentRealtime]);
}
