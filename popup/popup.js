document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("keyword");
  const searchButton = document.getElementById("search");
  const clearCacheButton = document.getElementById("clearCache");
  const matchCountElement = document.getElementById("matchCount");

  const refreshContentScript = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            document.dispatchEvent(new Event("DOMContentLoaded"));
          },
        });
      }
    });
  };

  chrome.storage.local.get(["keyword", "keywordMatchCount"], (data) => {
    input.value = data.keyword || "";
    matchCountElement.textContent = data.keywordMatchCount || 0;
  });

  searchButton.addEventListener("click", () => {
    chrome.storage.local.set({ keyword: input.value }, () => {
      alert("Search started!");
      refreshContentScript();
    });
  });

  clearCacheButton.addEventListener("click", () => {
    chrome.storage.local.clear(() => {
      matchCountElement.textContent = "0";
      input.value = "";
      alert("Cache cleared!");
      refreshContentScript();
    });
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.keywordMatchCount) {
      matchCountElement.textContent = changes.keywordMatchCount.newValue;
    }
  });
});
