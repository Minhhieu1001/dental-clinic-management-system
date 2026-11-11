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
    const callbacksRef = useRef({
        onAppointmentRealtime,
        onNotificationRealtime,
        onRequestRealtime,
        onPaymentRealtime,
    });

    // Keep callbacks up-to-date without triggering STOMP reconnects
    useEffect(() => {
        callbacksRef.current = {
            onAppointmentRealtime,
            onNotificationRealtime,
            onRequestRealtime,
            onPaymentRealtime,
        };
    });

    useEffect(() => {
        const currentUser = useAuthStore.getState().user;
        const employeeId = currentUser?.employeeId || currentUser?.id || null;

        const wsUrl = import.meta.env.VITE_WS_URL;

        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            reconnectDelay: 5000,
            onConnect: () => {
                // 1. Subscribe nhận thông báo cập nhật lịch hẹn chung
                client.subscribe('/topic/appointments', (message) => {
                    try {
                        const payload = JSON.parse(message.body);
                        if (callbacksRef.current.onAppointmentRealtime) {
                            callbacksRef.current.onAppointmentRealtime(payload);
                        }
                    } catch (e) {
                        console.warn('Error parsing /topic/appointments payload:', e);
                    }
                });

                // 2. Subscribe nhận thông báo riêng của User hiện tại (Unicast)
                client.subscribe('/user/queue/notifications', (message) => {
                    try {
                        const payload = JSON.parse(message.body);
                        if (callbacksRef.current.onNotificationRealtime) {
                            callbacksRef.current.onNotificationRealtime(payload);
                        }
                    } catch (e) {
                        console.warn('Error parsing /user/queue/notifications payload:', e);
                    }
                });

                // 3. Subscribe nhận thông báo chung (Broadcast topic)
                client.subscribe('/topic/notifications', (message) => {
                    try {
                        const payload = JSON.parse(message.body);
                        if (callbacksRef.current.onNotificationRealtime) {
                            callbacksRef.current.onNotificationRealtime(payload);
                        }
                    } catch (e) {
                        console.warn('Error parsing /topic/notifications payload:', e);
                    }
                });

                // 4. Subscribe nhận yêu cầu đặt lịch hẹn mới từ Web (Online Requests)
                client.subscribe('/user/queue/appointment-requests', (message) => {
                    try {
                        const payload = JSON.parse(message.body);
                        if (callbacksRef.current.onRequestRealtime) {
                            callbacksRef.current.onRequestRealtime(payload);
                        }
                    } catch (e) {
                        console.warn('Error parsing /user/queue/appointment-requests payload:', e);
                    }
                });

                // 5. Subscribe nhận thông báo thanh toán thành công RIÊNG (Unicast Private)
                client.subscribe('/user/queue/payments', (message) => {
                    try {
                        const payload = JSON.parse(message.body);
                        if (callbacksRef.current.onPaymentRealtime) {
                            callbacksRef.current.onPaymentRealtime(payload);
                        }
                    } catch (e) {
                        console.warn('Error parsing /user/queue/payments payload:', e);
                    }
                });

                if (employeeId) {
                    client.subscribe(`/topic/payments/${employeeId}`, (message) => {
                        try {
                            const payload = JSON.parse(message.body);
                            if (callbacksRef.current.onPaymentRealtime) {
                                callbacksRef.current.onPaymentRealtime(payload);
                            }
                        } catch (e) {
                            console.warn(`Error parsing /topic/payments/${employeeId} payload:`, e);
                        }
                    });
                }
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) clientRef.current.deactivate();
        };
    }, []);
}
