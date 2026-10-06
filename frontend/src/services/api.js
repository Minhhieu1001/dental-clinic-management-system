import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const getServices = async () => {
  const response = await apiClient.get('/services')
  return response.data?.data ?? response.data?.result ?? response.data ?? []
}

export const getDentists = async () => {
  const response = await apiClient.get('/dentists')
  return response.data
}

export const getReviews = async () => {
  const response = await apiClient.get('/reviews')
  return response.data
}

export const getPromotions = async () => {
  const response = await apiClient.get('/promotions')
  return response.data
}



export const getPromotion = async (id) => {
  const response = await apiClient.get(`/promotions/${id}`)
  return response.data
}

export const createAppointment = async (bookingData) => {
  const response = await apiClient.post('/appointments', bookingData)
  return response.data
}

export default apiClient
