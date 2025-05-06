document.addEventListener("DOMContentLoaded", () => {
  console.log("Content script loaded");
  
  let processedComments = new Set();
  let keywordMatchedComments = new Set();
  let lastUrl = window.location.href;

  const clearStorage = () => {
    chrome.storage.local.clear(() => {
      console.log("Storage cleared on refresh or new video");
    });
  };

  // Clear storage when page refreshes
  window.addEventListener("beforeunload", clearStorage);

  // Detect URL changes (new video click) and clear storage
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      clearStorage();
    }
  }, 1000);

  const updatePopupCount = () => {
    chrome.storage.local.set({
      keywordMatchCount: keywordMatchedComments.size
    });
  };

  const filterAndHighlightComments = (comments) => {
    chrome.storage.local.get("keyword", (data) => {
      let keyword = data.keyword || "";
      if (!keyword.trim()) return;
      
      comments.forEach((comment) => {
        let commentText = comment.innerText.trim();
        if (!commentText || processedComments.has(comment)) return; // Skip already processed comments
        
        processedComments.add(comment);

        if (commentText.includes(keyword)) {
          keywordMatchedComments.add(commentText); // Track matched comments
          comment.closest("ytd-comment-thread-renderer").style.display = "";
          
          // Highlight the keyword
          let regex = new RegExp(`(${keyword})`, "gi");
          comment.innerHTML = commentText.replace(regex, '<span style="background-color: yellow; color: black;">$1</span>');
        } else {
          comment.closest("ytd-comment-thread-renderer").style.display = "none";
        }
      });
      
      updatePopupCount(); // Update the popup display
    });
  };

  const observer = new MutationObserver((mutations) => {
    let newComments = new Set();
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.querySelectorAll) {
          node.querySelectorAll("#content-text").forEach((comment) => {
            if (!processedComments.has(comment)) {
              newComments.add(comment);
            }
          });
        }
      });
    });
    if (newComments.size > 0) {
      filterAndHighlightComments(Array.from(newComments));
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial scan
  setTimeout(() => {
    filterAndHighlightComments(document.querySelectorAll("#content-text"));
  }, 1000);

  // Listen for storage changes to update filtering and highlighting in real-time
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.keyword && namespace === "local") {
      processedComments.clear(); // Reset cache to reprocess all comments
      keywordMatchedComments.clear();
      filterAndHighlightComments(document.querySelectorAll("#content-text"));
    }
  });
});
