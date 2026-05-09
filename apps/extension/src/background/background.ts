import type { ExtensionAdPayload } from '@adspy/types';

const API_URL = 'https://api.yourdomain.com'; // Override via storage

// ── Message handler ────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SUBMIT_ADS') {
    submitAds(message.ads).then(sendResponse).catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === 'GET_STATUS') {
    getStatus().then(sendResponse);
    return true;
  }

  if (message.type === 'START_MINING') {
    startAutoMining(message.tabId);
    sendResponse({ started: true });
  }

  if (message.type === 'STOP_MINING') {
    stopAutoMining();
    sendResponse({ stopped: true });
  }
});

// ── Alarm-based auto mining ────────────────────────────────────
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoMining') {
    triggerMiningOnActiveTab();
  }
});

async function startAutoMining(tabId?: number) {
  await chrome.storage.local.set({ miningActive: true, miningTabId: tabId });
  chrome.alarms.create('autoMining', { periodInMinutes: 5 });
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon48.png',
    title: 'AdSpy Mining Started',
    message: 'Auto-mining every 5 minutes',
  });
}

async function stopAutoMining() {
  await chrome.storage.local.set({ miningActive: false });
  chrome.alarms.clear('autoMining');
}

async function triggerMiningOnActiveTab() {
  const { miningTabId } = await chrome.storage.local.get('miningTabId');

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = miningTabId ?? tabs[0]?.id;

  if (!tabId) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        window.dispatchEvent(new CustomEvent('ADSPY_TRIGGER_MINING'));
      },
    });
  } catch {
    // Tab may have navigated away
  }
}

async function submitAds(ads: ExtensionAdPayload[]): Promise<{ success: boolean; newAds?: number }> {
  const { accessToken, apiUrl } = await chrome.storage.local.get(['accessToken', 'apiUrl']);
  const baseUrl = apiUrl ?? API_URL;

  if (!accessToken) {
    return { success: false };
  }

  const res = await fetch(`${baseUrl}/api/mining/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ ads }),
  });

  const data = await res.json();
  return { success: data.success, newAds: data.data?.newAds };
}

async function getStatus() {
  const { miningActive, accessToken } = await chrome.storage.local.get([
    'miningActive',
    'accessToken',
  ]);
  return { miningActive: !!miningActive, loggedIn: !!accessToken };
}
