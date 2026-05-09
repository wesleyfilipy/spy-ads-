const API_URL_DEFAULT = 'https://api.yourdomain.com';
const FRONTEND_URL = 'https://app.yourdomain.com';

let sessionAds = 0;
let autoMiningActive = false;
let currentFilter = '';
let feedAds: FeedAd[] = [];

interface FeedAd {
  id: string;
  pageName?: string;
  domain?: string;
  status: string;
  isScaled: boolean;
  isDuplicate: boolean;
  creatives: Array<{ thumbnailUrl?: string; type: string; callToAction?: string }>;
}

async function init() {
  showView('loading');

  const { accessToken, user, apiUrl, miningActive } = await chrome.storage.local.get([
    'accessToken', 'user', 'apiUrl', 'miningActive',
  ]);

  if (accessToken && user) {
    populateUser(user);
    autoMiningActive = !!miningActive;
    updateToggle(autoMiningActive);
    showView('main');
    await Promise.all([loadStats(accessToken, apiUrl), loadFeed(accessToken, apiUrl)]);
  } else {
    showView('login');
  }

  bindEvents();
}

function showView(view: 'loading' | 'login' | 'main') {
  ['loading', 'login', 'main'].forEach((v) => {
    const el = document.getElementById(`${v}-view`);
    if (el) el.classList.toggle('hidden', v !== view);
  });
}

function populateUser(user: { email: string; subscription?: { plan: string } }) {
  const badge = document.getElementById('plan-badge');
  if (badge) badge.textContent = user.subscription?.plan ?? 'FREE';
}

async function loadStats(token: string, apiUrl?: string) {
  const base = apiUrl ?? API_URL_DEFAULT;
  try {
    const res = await fetch(`${base}/api/ads/stats/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setEl('total-ads', data.data?.total?.toLocaleString() ?? '—');
    setEl('active-ads', data.data?.active?.toLocaleString() ?? '—');
    setEl('scaled-ads', data.data?.scaled?.toLocaleString() ?? '—');
  } catch {}
}

async function loadFeed(token: string, apiUrl?: string, filter = '') {
  const base = apiUrl ?? API_URL_DEFAULT;
  try {
    const params = new URLSearchParams({ limit: '20', sortBy: 'createdAt', sortOrder: 'desc', ...(filter ? Object.fromEntries(filter.split('&').map((p) => p.split('='))) : {}) });
    const res = await fetch(`${base}/api/ads?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    feedAds = data.data ?? [];
    renderFeed();
  } catch {}
}

function renderFeed() {
  const container = document.getElementById('ad-feed');
  if (!container) return;

  const feedCount = document.getElementById('feed-count');
  if (feedCount) feedCount.textContent = String(feedAds.length);

  if (feedAds.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div>No ads found. Navigate to Facebook Ads Library and mine!</div>
      </div>
    `;
    return;
  }

  container.innerHTML = feedAds.map((ad) => {
    const thumb = ad.creatives[0]?.thumbnailUrl;
    const isVideo = ad.creatives[0]?.type === 'VIDEO';
    const cta = ad.creatives[0]?.callToAction ?? '';

    return `
      <div class="feed-ad" data-id="${ad.id}">
        <div class="feed-thumb">
          ${thumb
            ? `<img src="${thumb}" alt="" loading="lazy" />`
            : `<span class="feed-thumb-icon">${isVideo ? '🎥' : '🖼️'}</span>`}
        </div>
        <div class="feed-info">
          <div class="feed-page">${ad.pageName ?? 'Unknown Page'}</div>
          <div class="feed-domain">${ad.domain ?? '—'}</div>
          <div class="feed-badges">
            ${ad.status === 'ACTIVE' ? '<span class="badge badge-active">Active</span>' : ''}
            ${ad.isScaled ? '<span class="badge badge-scaled">🔥 Scaled</span>' : ''}
            ${isVideo ? '<span class="badge badge-video">Video</span>' : ''}
            ${cta ? `<span class="badge" style="background:rgba(99,102,241,0.15);color:#a5b4fc;border:1px solid rgba(99,102,241,0.3)">${cta}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Ad click → open in dashboard
  container.querySelectorAll('.feed-ad').forEach((card) => {
    card.addEventListener('click', () => {
      const adId = (card as HTMLElement).dataset.id;
      chrome.tabs.create({ url: `${FRONTEND_URL}/dashboard/ads/${adId}` });
    });
  });
}

function updateToggle(active: boolean) {
  autoMiningActive = active;
  const toggle = document.getElementById('auto-mine-toggle') as HTMLInputElement | null;
  const statusText = document.getElementById('mining-status-text');
  if (toggle) toggle.checked = active;
  if (statusText) {
    statusText.textContent = active ? 'Active' : 'Inactive';
    statusText.className = `status-text ${active ? 'active' : 'inactive'}`;
  }
}

function setEl(id: string, value: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function bindEvents() {
  // Login
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const errorEl = document.getElementById('error')!;
    const btn = document.getElementById('login-btn') as HTMLButtonElement;

    btn.disabled = true;
    btn.textContent = 'Signing in...';
    errorEl.classList.add('hidden');

    try {
      const apiUrl = API_URL_DEFAULT;
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error ?? 'Login failed');

      await chrome.storage.local.set({
        accessToken: data.data.tokens.accessToken,
        refreshToken: data.data.tokens.refreshToken,
        user: data.data.user,
        apiUrl,
      });

      populateUser(data.data.user);
      showView('main');
      await Promise.all([loadStats(data.data.tokens.accessToken, apiUrl), loadFeed(data.data.tokens.accessToken, apiUrl)]);
    } catch (err) {
      errorEl.textContent = (err as Error).message;
      errorEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await chrome.storage.local.clear();
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
    } else if (tab.id) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.dispatchEvent(new CustomEvent('ADSPY_TRIGGER_MINING')),
      });
      sessionAds++;
      setEl('session-ads', String(sessionAds));
    }

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = '⚡ Mine Now';
    }, 2000);
  });

  // Auto-mine toggle
  document.getElementById('auto-mine-toggle')?.addEventListener('change', async (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    if (checked) {
      await chrome.runtime.sendMessage({ type: 'START_MINING', tabId: tabs[0]?.id });
    } else {
      await chrome.runtime.sendMessage({ type: 'STOP_MINING' });
    }
    updateToggle(checked);
    await chrome.storage.local.set({ miningActive: checked });
  });

  // Filter chips
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', async () => {
      document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = (chip as HTMLElement).dataset.filter ?? '';

      const { accessToken, apiUrl } = await chrome.storage.local.get(['accessToken', 'apiUrl']);
      if (accessToken) await loadFeed(accessToken, apiUrl, currentFilter);
    });
  });

  // Dashboard link
  document.getElementById('dashboard-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${FRONTEND_URL}/dashboard` });
  });

  // Listen for new ads from content script
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'NEW_ADS_COLLECTED' && msg.count > 0) {
      sessionAds += msg.count;
      setEl('session-ads', String(sessionAds));
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
