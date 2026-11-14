
import api from './axios';

export { getServices } from './service.service';
export { getDentists } from './dentist.service';
export { getReviews } from './review.service';
export { getPromotions, getPromotion, getTodayPromotions } from './promotion.service';
export { createPublicAppointment as createAppointment } from './appointment.service';

export default api;
