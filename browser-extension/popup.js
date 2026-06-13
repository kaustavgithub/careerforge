const urlInput = document.getElementById('cf_url')
const tokenInput = document.getElementById('cf_token')
const saveBtn = document.getElementById('save')
const statusEl = document.getElementById('status')

// Load saved values
chrome.storage.local.get(['cf_url', 'cf_token'], ({ cf_url, cf_token }) => {
  if (cf_url) urlInput.value = cf_url
  if (cf_token) tokenInput.value = cf_token
})

saveBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim().replace(/\/$/, '')
  const token = tokenInput.value.trim()

  if (!url || !token) {
    status('Both fields are required', '#f87171')
    return
  }

  // Quick connectivity check
  try {
    const res = await fetch(`${url}/api/health`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (e) {
    status(`Cannot reach CareerForge: ${e.message}`, '#f87171')
    return
  }

  await chrome.storage.local.set({ cf_url: url, cf_token: token })
  status('Saved ✓', '#4ade80')
  setTimeout(() => status('', ''), 2000)
})

function status(msg, color) {
  statusEl.textContent = msg
  statusEl.style.color = color
}
