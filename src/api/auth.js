import api from './axios'

export const authApi = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },
}

export const childRecordApi = {
  create: async (data) => {
    const response = await api.post('/childrecords', data)
    return response.data
  },
  getAll: async () => {
    const response = await api.get('/childrecords')
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/childrecords/${id}`, data)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/childrecords/${id}`)
    return response.data
  },
  deleteMany: async (ids) => {
    const response = await api.post('/childrecords/batch-delete', ids)
    return response.data
  },
}

export const reportApi = {
  getBarangayReport: async (barangay) => {
    const response = await api.get(`/reports/barangay/${barangay}`)
    return response.data
  },
  getOverallReport: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    const response = await api.get(`/reports/overall?${query}`)
    return response.data
  },
  getChildRecords: async (barangay = null) => {
    const params = barangay ? `?barangay=${barangay}` : ''
    const response = await api.get(`/reports/child-records${params}`)
    return response.data
  },
}