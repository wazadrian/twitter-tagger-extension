// Injects tag editor next to usernames on Twitter
(function () {
  const existingTags = {};

  // Function to add a tag editor to each username
  function addTagEditors() {
    // Select all <a> elements that are not already tagged
    const userElements = document.querySelectorAll("a:not([data-tagged])");

    userElements.forEach((userElement) => {
      // Look for a child <span> containing an "@" sign
      const spanChild = userElement.querySelector("span");
      if (!spanChild || !spanChild.textContent.includes("@")) return;

      // Get username from the <a> href attribute
      const username = userElement.getAttribute("href").slice(1);
      if (!username || existingTags[username]) return;

      userElement.setAttribute("data-tagged", "true");

      // Check if the user has an existing tag
      chrome.storage.sync.get(username, (data) => {
        if (data[username]) {
          // If tag exists, show it as a clickable label for deletion
          const tagLabel = document.createElement("span");
          tagLabel.classList.add("tag-label");
          tagLabel.innerText = `(${data[username]})`;
          tagLabel.style.cursor = "pointer";

          // Set up a click event to delete the tag on click
          tagLabel.addEventListener("click", () => {
            if (confirm(`Delete tag for @${username}?`)) {
              chrome.storage.sync.remove(username, () => {
                delete existingTags[username];
                location.reload(); // Refresh to hide deleted tag
              });
            }
          });

          userElement.appendChild(tagLabel);
          existingTags[username] = data[username];
        } else {
          // If no tag exists, show the "[Tag]" button to add a new tag
          const tagButton = document.createElement("span");
          tagButton.classList.add("tag-button");
          tagButton.innerText = "[Tag]";
          tagButton.addEventListener("click", () => {
            const userTag = prompt(`Enter a tag for @${username}:`, "");
            if (userTag) {
              chrome.storage.sync.set({ [username]: userTag }, () => {
                existingTags[username] = userTag;
                location.reload(); // Refresh to show the new tag
              });
            }
          });

          userElement.appendChild(tagButton);
        }
      });
    });
  }

  // Observe changes on Twitter page and apply tag editors
  const observer = new MutationObserver(addTagEditors);
  observer.observe(document.body, { childList: true, subtree: true });
})();
