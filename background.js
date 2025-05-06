chrome.runtime.onInstalled.addListener(() => {
  console.log("YouTube Comment Filter Extension Installed");
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  chrome.storage.local.clear(() => {
    console.log("Cache cleared as YouTube tab was closed");
  });
});
