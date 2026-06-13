(() => {
  const BTN_ID = 'careerforge-save-btn'
  let lastUrl = ''

  // ── DOM helpers ────────────────────────────────────────────────────────────

  function first(...selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel)
      if (el?.innerText?.trim()) return el.innerText.trim()
    }
    return ''
  }

  function getJobTitle() {
    return first(
      '.job-details-jobs-unified-top-card__job-title h1',
      '.jobs-unified-top-card__job-title h1',
      '.topcard__title',
      'h1.t-24',
      'h1'
    )
  }

  function getCompany() {
    return first(
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.topcard__org-name-link',
      '[data-test-employer-name]'
    )
  }

  function getLocation() {
    return first(
      '.job-details-jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__bullet',
      '.topcard__flavor--bullet',
      '.job-details-jobs-unified-top-card__primary-description .tvm__text--neutral'
    )
  }

  function getDescription() {
    return first(
      '#job-details',
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      '.description__text'
    )
  }

  // ── Button injection ───────────────────────────────────────────────────────

  function injectButton() {
    if (document.getElementById(BTN_ID)) return

    // Find the apply button area — try multiple anchor points
    const anchor =
      document.querySelector('.jobs-apply-button--top-card') ||
      document.querySelector('.jobs-unified-top-card__content--two-pane .jobs-apply-button') ||
      document.querySelector('[data-job-id]') ||
      document.querySelector('.job-details-jobs-unified-top-card__container--two-pane')

    if (!anchor) return

    const btn = document.createElement('button')
    btn.id = BTN_ID
    btn.innerText = '⚡ Save to CareerForge'
    Object.assign(btn.style, {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      marginLeft: '8px',
      padding: '8px 16px',
      borderRadius: '8px',
      border: '1px solid rgba(99,102,241,0.5)',
      background: 'rgba(99,102,241,0.12)',
      color: '#818cf8',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      verticalAlign: 'middle',
      transition: 'all 0.15s',
    })

    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(99,102,241,0.25)'
      btn.style.borderColor = 'rgba(99,102,241,0.8)'
    })
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(99,102,241,0.12)'
      btn.style.borderColor = 'rgba(99,102,241,0.5)'
    })

    btn.addEventListener('click', handleSave)
    anchor.appendChild(btn)
  }

  // ── Save handler ───────────────────────────────────────────────────────────

  async function handleSave() {
    const btn = document.getElementById(BTN_ID)
    if (!btn) return

    const { cf_url, cf_token } = await chrome.storage.local.get(['cf_url', 'cf_token'])

    if (!cf_url || !cf_token) {
      setStatus(btn, '⚠ Configure CareerForge extension first', '#f87171')
      return
    }

    const title = getJobTitle()
    const description = getDescription()

    if (!title || !description) {
      setStatus(btn, '⚠ Could not read job details', '#f87171')
      return
    }

    setStatus(btn, 'Saving…', '#94a3b8')

    try {
      const res = await fetch(`${cf_url.replace(/\/$/, '')}/api/jobs/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cf_token}`,
        },
        body: JSON.stringify({
          title,
          company: getCompany(),
          location: getLocation(),
          description,
          apply_url: window.location.href,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }

      setStatus(btn, '✓ Saved — cover letter generated!', '#4ade80')
      setTimeout(() => setStatus(btn, '⚡ Save to CareerForge', '#818cf8'), 4000)
    } catch (e) {
      setStatus(btn, `✗ ${e.message}`, '#f87171')
      setTimeout(() => setStatus(btn, '⚡ Save to CareerForge', '#818cf8'), 4000)
    }
  }

  function setStatus(btn, text, color) {
    btn.innerText = text
    btn.style.color = color
    btn.style.borderColor = color + '80'
    btn.style.background = color + '18'
  }

  // ── SPA navigation watcher ─────────────────────────────────────────────────
  // LinkedIn is a SPA — URL changes without full page reloads

  function onUrlChange() {
    const url = window.location.href
    if (url === lastUrl) return
    lastUrl = url

    // Remove stale button if we navigated away from a job page
    document.getElementById(BTN_ID)?.remove()

    if (url.includes('/jobs/view/') || url.includes('/jobs/search/')) {
      // Wait for job detail panel to render then inject
      const MAX = 20
      let tries = 0
      const poll = setInterval(() => {
        tries++
        const title = getJobTitle()
        if (title) {
          injectButton()
          clearInterval(poll)
        }
        if (tries >= MAX) clearInterval(poll)
      }, 500)
    }
  }

  // Watch for SPA navigation
  const observer = new MutationObserver(onUrlChange)
  observer.observe(document.body, { childList: true, subtree: true })
  onUrlChange() // run once on initial load
})()
