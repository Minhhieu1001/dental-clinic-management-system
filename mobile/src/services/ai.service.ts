import api from './api';

export interface AiChatResponseData {
  reply: string;
  sessionId: string;
}

export const aiService = {
  chatWithAgent: async (message: string, sessionId?: string): Promise<AiChatResponseData> => {
    const res = await api.post(
      '/ai/chat',
      {
        message,
        sessionId: sessionId || undefined,
      },
      { timeout: 60000 }
    );
    const data = res?.data?.data ?? res?.data;
    return {
      reply: data?.reply || '',
      sessionId: data?.sessionId || sessionId || '',
    };
  },
};
