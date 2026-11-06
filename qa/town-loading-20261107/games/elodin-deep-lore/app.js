// Filter state
let filterState = {
  searchTerm: "",
  category: "all",
  evidence: "all",
  confidence: "all",
};

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  renderEntries();
  renderGaps();
  attachEventListeners();
  updateStats();
});

// Attach event listeners to filter chips and search input
function attachEventListeners() {
  // Search input
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filterState.searchTerm = e.target.value.toLowerCase();
      renderEntries();
      updateStats();
    });
  }

  // Category chips
  document.querySelectorAll('[data-filter="category"]').forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll('[data-filter="category"]').forEach((c) => {
        c.classList.remove("active");
      });
      chip.classList.add("active");
      filterState.category = chip.dataset.value;
      renderEntries();
      updateStats();
    });
  });

  // Evidence chips
  document.querySelectorAll('[data-filter="evidence"]').forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll('[data-filter="evidence"]').forEach((c) => {
        c.classList.remove("active");
      });
      chip.classList.add("active");
      filterState.evidence = chip.dataset.value;
      renderEntries();
      updateStats();
    });
  });

  // Confidence chips
  document.querySelectorAll('[data-filter="confidence"]').forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll('[data-filter="confidence"]').forEach((c) => {
        c.classList.remove("active");
      });
      chip.classList.add("active");
      filterState.confidence = chip.dataset.value;
      renderEntries();
      updateStats();
    });
  });
}

// Filter entries based on current filter state
function getFilteredEntries() {
  return ELODIN_DATA.entries.filter((entry) => {
    // Search filter
    if (filterState.searchTerm) {
      const searchMatches =
        entry.title.toLowerCase().includes(filterState.searchTerm) ||
        entry.summary.toLowerCase().includes(filterState.searchTerm) ||
        entry.implications.toLowerCase().includes(filterState.searchTerm);
      if (!searchMatches) return false;
    }

    // Category filter
    if (filterState.category !== "all" && entry.category !== filterState.category) {
      return false;
    }

    // Evidence filter
    if (filterState.evidence !== "all" && entry.evidence !== filterState.evidence) {
      return false;
    }

    // Confidence filter
    if (filterState.confidence !== "all" && entry.confidence !== filterState.confidence) {
      return false;
    }

    return true;
  });
}

// Render filtered entries
function renderEntries() {
  const entryList = document.getElementById("entry-list");
  if (!entryList) return;

  const filtered = getFilteredEntries();

  if (filtered.length === 0) {
    entryList.innerHTML =
      '<div style="padding: 40px; text-align: center; color: var(--color-text-dim);">No entries match your filters.</div>';
    return;
  }

  entryList.innerHTML = filtered
    .map((entry) => {
      const badgeClass = entry.evidence.toLowerCase();
      const confidenceClass = entry.confidence.toLowerCase();

      const sourcesHTML =
        entry.sources && entry.sources.length > 0
          ? `
          <div class="entry-sources">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${entry.sources
                .map(
                  (source) => `
                <a href="#" class="source-link" title="${source.note || ""}">${source.label}</a>
              `
                )
                .join("")}
            </div>
          </div>
        `
          : "";

      return `
        <article class="entry-card">
          <div class="entry-header">
            <h3>${entry.title}</h3>
            <div class="entry-badges">
              <span class="badge ${badgeClass}">${entry.evidence}</span>
              <span class="badge ${confidenceClass}">${entry.confidence}</span>
            </div>
          </div>
          <div class="entry-body">
            <div class="entry-section">
              <h4>Summary</h4>
              <p class="entry-text">${entry.summary}</p>
            </div>
            <div class="entry-section">
              <h4>Why It Matters</h4>
              <p class="entry-text">${entry.implications}</p>
            </div>
            <div class="entry-section">
              <h4>Category</h4>
              <p class="entry-text" style="font-size: 0.9rem;">${entry.category}</p>
            </div>
            ${sourcesHTML}
          </div>
        </article>
      `;
    })
    .join("");
}

// Render gaps/research questions
function renderGaps() {
  const gapsGrid = document.getElementById("gaps-grid");
  if (!gapsGrid || !ELODIN_DATA.gaps) return;

  gapsGrid.innerHTML = ELODIN_DATA.gaps
    .map((gap) => {
      return `
        <div class="gap-card">
          <h3>${gap.question}</h3>
          <p>${gap.context}</p>
        </div>
      `;
    })
    .join("");
}

// Update stats based on filtered entries
function updateStats() {
  const filtered = getFilteredEntries();
  const canonCount = filtered.filter((e) => e.evidence === "Canon").length;
  const theoryCount = filtered.filter((e) => e.evidence === "Theory").length;

  const statEntries = document.getElementById("stat-entries");
  const statCanon = document.getElementById("stat-canon");
  const statTheory = document.getElementById("stat-theory");

  if (statEntries) statEntries.textContent = filtered.length;
  if (statCanon) statCanon.textContent = canonCount;
  if (statTheory) statTheory.textContent = theoryCount;
}
