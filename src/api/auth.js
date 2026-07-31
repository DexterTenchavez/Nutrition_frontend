import api from './axios'

export const authApi = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },
}

export const reportApi = {
  create: async (data) => {
    const { puroks, barangay, quarter, year, remarks } = data
    const results = []

    for (const purok of puroks) {
      if (purok.months6To11 === 0 && purok.months12To59 === 0 && purok.underweightSUW === 0) {
        continue
      }

      const response = await api.post('/reports', {
        barangay: barangay,
        purok: purok.purok,
        months6To11: purok.months6To11,
        months12To59: purok.months12To59,
        underweightSUW: purok.underweightSUW,
        quarter: quarter,
        year: year,
        remarks: remarks
      })
      results.push(response.data)
    }

    return results
  },

  getAll: async (params = {}) => {
    const response = await api.get('/reports', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/reports/${id}`)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(`/reports/${id}`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/reports/${id}`)
    return response.data
  },

  approve: async (id, remarks = null) => {
    const response = await api.post(`/reports/${id}/approve`, remarks)
    return response.data
  },

  getOverall: async (params = {}) => {
    const response = await api.get('/reports/overall', { params })
    return response.data
  },

  getBarangaySummary: async (barangay) => {
    const response = await api.get(`/reports/barangay/${barangay}/summary`)
    return response.data
  },

  getMyReports: async () => {
    const response = await api.get('/reports/my-reports')
    return response.data
  },
}