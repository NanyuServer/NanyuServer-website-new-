const API_BASE = '/api'

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

export const submissionsApi = {
  getAll() {
    return request('/submissions')
  },
  create(payload) {
    return request('/submissions', {
      method: 'POST',
      headers: { 'x-admin-secret': localStorage.getItem('adminToken') || '' },
      body: JSON.stringify(payload)
    })
  },
  update(id, payload) {
    return request(`/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'x-admin-secret': localStorage.getItem('adminToken') || '' },
      body: JSON.stringify(payload)
    })
  },
  remove(id) {
    return request(`/submissions/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-secret': localStorage.getItem('adminToken') || '' }
    })
  }
}

export const feedbackApi = {
  getApproved() {
    return request('/feedback')
  },
  submit(payload) {
    return request('/feedback', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }
}

export const adminFeedbackApi = {
  getAll() {
    return request('/admin-feedback', {
      headers: { 'x-admin-secret': localStorage.getItem('adminToken') || '' }
    })
  },
  update(payload) {
    return request('/admin-feedback', {
      method: 'PUT',
      headers: { 'x-admin-secret': localStorage.getItem('adminToken') || '' },
      body: JSON.stringify(payload)
    })
  }
}

export const recruitmentsApi = {
  getAll() {
    return request('/recruitments')
  },
  create(payload) {
    return request('/recruitments', {
      method: 'POST',
      headers: { 'x-admin-secret': localStorage.getItem('adminToken') || '' },
      body: JSON.stringify(payload)
    })
  },
  update(id, payload) {
    return request(`/recruitments/${id}`, {
      method: 'PATCH',
      headers: { 'x-admin-secret': localStorage.getItem('adminToken') || '' },
      body: JSON.stringify(payload)
    })
  },
  remove(id) {
    return request(`/recruitments/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-secret': localStorage.getItem('adminToken') || '' }
    })
  }
}

export const recruitApplicantsApi = {
  getAll() {
    return request('/recruit-applicants', {
      headers: { 'x-admin-secret': localStorage.getItem('adminToken') || '' }
    })
  },
  submit(payload) {
    return request('/recruit-applicants', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }
}

export const authApi = {
  init() {
    return request('/auth')
  },
  login(username, password) {
    return request('/auth', {
      method: 'POST',
      headers: { 'x-action': 'login' },
      body: JSON.stringify({ username, password })
    })
  },
  verify(token) {
    return request('/auth', {
      method: 'POST',
      headers: { 'x-action': 'verify', 'x-admin-secret': token }
    })
  },
  changePassword(username, old_password, new_password) {
    return request('/auth', {
      method: 'POST',
      headers: { 'x-action': 'change-password' },
      body: JSON.stringify({ username, old_password, new_password })
    })
  }
}
