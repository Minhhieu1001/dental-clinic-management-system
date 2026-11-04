import api from './axios';

export const chatWithAiAgent = async (message, sessionId = '') => {
  const response = await api.post('/ai/chat', {
    message,
    sessionId: sessionId || undefined,
  });
  return response.data;
};

