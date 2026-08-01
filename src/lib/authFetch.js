export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token')
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    window.location.href = '/login?expired=1'
    return null
  }

  return res
}
