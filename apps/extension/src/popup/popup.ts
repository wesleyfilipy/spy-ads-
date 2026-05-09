const API_URL_DEFAULT = 'https://api.yourdomain.com';
const FRONTEND_URL = 'https://app.yourdomain.com';

let sessionCount = 0;
let autoMiningActive = false;

async function init() {
  showView('loading');

  const { accessToken, user, apiUrl } = await chrome.storage.local.get([
    'accessToken',
    'user',
    'apiUrl',
  ]);

  const apiUrlInput = document.getElementById('api-url') as HTMLInputElement;
  if (apiUrlInput && apiUrl) apiUrlInput.value = apiUrl;

  if (accessToken && user) {
    populateDashboard(user);
    showView('dashboard');
    await loadStats();
  } else {
    showView('login');
  }

  bindEvents();
}

function showView(view: 'login' | 'dashboard' | 'loading') {
  document.getElementById('login-view')!.classList.add('hidden');
  document.getElementById('dashboard-view')!.classList.add('hidden');
  document.getElementById('loading-view')!.classList.add('hidden');
  document.getElementById(`${view}-view`)!.classList.remove('hidden');
}

function populateDashboard(user: { email: string; subscription?: { plan: string } }) {
  const emailEl = document.getElementById('user-email');
  const planEl = document.getElementById('user-plan');
  if (emailEl) emailEl.textContent = user.email;
  if (planEl) planEl.textContent = user.subscription?.plan ?? 'FREE';
}

async function loadStats() {
  try {
    const { accessToken, apiUrl } = await chrome.storage.local.get(['accessToken', 'apiUrl']);
    const baseUrl = apiUrl ?? API_URL_DEFAULT;

    const res = await fetch(`${baseUrl}/api/ads/stats/overview`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok) {
      const data = await res.json();
      const totalEl = document.getElementById('total-count');
      if (totalEl) totalEl.textContent = data.data?.total?.toLocaleString() ?? '—';
    }
  } catch {
    // Offline — leave placeholder
  }

  const status = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
  updateMiningStatus(status?.miningActive ?? false);
}

function updateMiningStatus(active: boolean) {
  autoMiningActive = active;
  const badge = document.getElementById('mining-status');
  const btn = document.getElementById('toggle-auto-btn');
  const pageStatus = document.getElementById('page-status');

  if (badge) {
    badge.textContent = active ? 'Active' : 'Inactive';
    badge.className = `status-badge ${active ? 'active' : 'inactive'}`;
  }
  if (btn) btn.textContent = active ? '⏹ Stop Auto-Mine' : '⏱ Start Auto-Mine';

  // Check if we're on FB Ads Library
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url ?? '';
    if (pageStatus) {
      if (url.includes('facebook.com/ads/library')) {
        pageStatus.textContent = '✓ Facebook Ads Library detected';
        pageStatus.style.color = '#34d399';
      } else {
        pageStatus.textContent = 'Navigate to Facebook Ads Library';
        pageStatus.style.color = '#64748b';
      }
    }
  });
}

function bindEvents() {
  // Login
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const apiUrl = (document.getElementById('api-url') as HTMLInputElement).value || API_URL_DEFAULT;
    const btn = document.getElementById('login-btn') as HTMLButtonElement;
    const errorEl = document.getElementById('login-error')!;

    btn.disabled = true;
    btn.textContent = 'Signing in...';
    errorEl.classList.add('hidden');

    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        errorEl.textContent = data.error ?? 'Login failed';
        errorEl.classList.remove('hidden');
        return;
      }

      await chrome.storage.local.set({
        accessToken: data.data.tokens.accessToken,
        refreshToken: data.data.tokens.refreshToken,
        user: data.data.user,
        apiUrl,
      });

      populateDashboard(data.data.user);
      showView('dashboard');
      await loadStats();
    } catch {
      errorEl.textContent = 'Cannot connect to API';
      errorEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await chrome.storage.local.remove(['accessToken', 'refreshToken', 'user']);
    showView('login');
  });

  // Mine now
  document.getElementById('mine-now-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('mine-now-btn') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = '⚡ Mining...';

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (!tab?.url?.includes('facebook.com/ads/library')) {
      chrome.tabs.create({ url: 'https://www.facebook.com/ads/library/' });
    } else {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: () => window.dispatchEvent(new CustomEvent('ADSPY_TRIGGER_MINING')),
      });

      sessionCount++;
      const sessionEl = document.getElementById('session-count');
      if (sessionEl) sessionEl.textContent = String(sessionCount);
    }

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = '⚡ Mine Now';
    }, 2000);
  });

  // Toggle auto-mine
  document.getElementById('toggle-auto-btn')?.addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    if (autoMiningActive) {
      await chrome.runtime.sendMessage({ type: 'STOP_MINING' });
      updateMiningStatus(false);
    } else {
      await chrome.runtime.sendMessage({ type: 'START_MINING', tabId: tabs[0]?.id });
      updateMiningStatus(true);
    }
  });

  // Dashboard link
  document.getElementById('dashboard-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: FRONTEND_URL });
  });
}

document.addEventListener('DOMContentLoaded', init);
