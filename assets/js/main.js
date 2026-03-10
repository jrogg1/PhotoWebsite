const CATEGORIES = ["portraits", "places", "animals"];
const REPO_CONFIG = {
  owner: "jrogg1",
  repo: "PhotoWebsite",
  branch: "main"
};

const FALLBACK_FILES = {
  portraits: [
    "3R3A0184.jpg",
    "3R3A0485.jpg",
    "3R3A0735.jpg",
    "3R3A0796.jpg",
    "3R3A0911.jpg",
    "3R3A6304.jpg",
    "3R3A8430.jpg",
    "3R3A9677.jpg",
    "3R3A9828.jpg"
  ],
  places: [
    "3F5A6885.jpg",
    "3F5A6927.jpg",
    "3F5A6973.jpg",
    "3F5A7083.jpg",
    "3F5A7088.jpg",
    "3F5A7279.jpg"
  ],
  animals: [
    "3F5A7468.jpg",
    "3F5A7496.jpg",
    "3F5A9356.jpg",
    "3F5A9642.jpg",
    "3F5A9751.jpg"
  ]
};

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|heic|avif)$/i;

const tabs = Array.from(document.querySelectorAll(".tab"));
const panels = Array.from(document.querySelectorAll(".panel"));
const grids = Array.from(document.querySelectorAll("[data-grid]"));
const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxCloseButton = document.querySelector("[data-lightbox-close]");
const lightboxPrevButton = document.querySelector("[data-lightbox-prev]");
const lightboxNextButton = document.querySelector("[data-lightbox-next]");
const sidebarMeta = document.querySelector(".sidebar-meta");
const MOBILE_BREAKPOINT_QUERY = "(max-width: 940px)";
const MOBILE_META_THRESHOLD = 80;

let photoSets = Object.fromEntries(CATEGORIES.map((category) => [category, []]));
let activeTabName = "portraits";
let activeLightboxSet = "portraits";
let activeLightboxIndex = 0;
let touchStartX = 0;
let touchStartY = 0;
let zoomScale = 1;
let zoomX = 0;
let zoomY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let panOriginX = 0;
let panOriginY = 0;
let gestureMoved = false;
let pinchStartDistance = 0;
let pinchStartScale = 1;
let clickNavTimer = null;
const activePointers = new Map();
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function setLightboxPageState(isOpen) {
  document.documentElement.classList.toggle("lightbox-open", isOpen);
  updateMobileMetaVisibility();
}

function updateMobileMetaVisibility() {
  if (!sidebarMeta) return;

  const isNarrow = window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
  const isLightboxOpen = document.documentElement.classList.contains("lightbox-open");
  if (!isNarrow || isLightboxOpen) {
    sidebarMeta.classList.remove("is-bottom-visible");
    return;
  }

  const scrollBottom = window.scrollY + window.innerHeight;
  const pageBottom = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  const nearBottom = pageBottom - scrollBottom <= MOBILE_META_THRESHOLD;
  sidebarMeta.classList.toggle("is-bottom-visible", nearBottom);
}

function setUpMobileMetaVisibility() {
  updateMobileMetaVisibility();
  window.addEventListener("scroll", updateMobileMetaVisibility, { passive: true });
  window.addEventListener("resize", updateMobileMetaVisibility);
  window.addEventListener("orientationchange", updateMobileMetaVisibility);
}

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function fileToAlt(filename, category) {
  const label = filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return `${category} ${label}`;
}

function buildLocalSrc(category, filename, version = "") {
  const encodedName = encodeURIComponent(filename);
  const src = `assets/images/portfolio/${category}/${encodedName}`;
  return version ? `${src}?v=${version}` : src;
}

function fallbackSet(category) {
  return (FALLBACK_FILES[category] || []).map((filename) => ({
    src: buildLocalSrc(category, filename),
    alt: fileToAlt(filename, category)
  }));
}

async function loadFromDirectoryListing(category) {
  const folderUrl = `assets/images/portfolio/${category}/`;

  try {
    const response = await fetch(folderUrl, { cache: "no-store" });
    if (!response.ok) return [];

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return [];

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const names = Array.from(doc.querySelectorAll("a[href]"))
      .map((anchor) => anchor.getAttribute("href") || "")
      .map((href) => href.split("?")[0].split("#")[0].replace(/\/$/, ""))
      .map((href) => href.slice(href.lastIndexOf("/") + 1))
      .map((name) => {
        try {
          return decodeURIComponent(name);
        } catch {
          return name;
        }
      })
      .filter((name) => name && name !== "." && name !== ".." && IMAGE_EXTENSIONS.test(name));

    const uniqueNames = [...new Set(names)].sort(naturalSort);

    return uniqueNames.map((filename) => ({
      src: buildLocalSrc(category, filename),
      alt: fileToAlt(filename, category)
    }));
  } catch {
    return [];
  }
}

async function loadFromGitHubApi(category) {
  const apiUrl = `https://api.github.com/repos/${REPO_CONFIG.owner}/${REPO_CONFIG.repo}/contents/assets/images/portfolio/${category}?ref=${REPO_CONFIG.branch}`;

  try {
    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" }
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const files = data
      .filter((entry) => entry.type === "file" && IMAGE_EXTENSIONS.test(entry.name))
      .sort((a, b) => naturalSort(a.name, b.name));

    return files.map((entry) => ({
      src: buildLocalSrc(category, entry.name, entry.sha ? entry.sha.slice(0, 10) : ""),
      alt: fileToAlt(entry.name, category)
    }));
  } catch {
    return [];
  }
}

async function loadCategory(category) {
  let items = await loadFromDirectoryListing(category);
  if (!items.length) items = await loadFromGitHubApi(category);
  if (!items.length) items = fallbackSet(category);
  photoSets[category] = items;
}

async function loadPhotoSets() {
  await Promise.all(CATEGORIES.map((category) => loadCategory(category)));
}

function renderSet(setKey, items) {
  if (!items.length) {
    return `<p class="empty-state">No images found in ${setKey}.</p>`;
  }

  return items
    .map(
      (item, index) => `
      <figure class="shot">
        <button class="shot-open" type="button" data-set="${setKey}" data-index="${index}" aria-label="Open image ${index + 1}">
          <div class="shot-media">
            <img src="${item.src}" alt="${item.alt}" loading="lazy" />
          </div>
        </button>
      </figure>
    `
    )
    .join("");
}

function renderGrids() {
  grids.forEach((grid) => {
    const key = grid.dataset.grid;
    const items = photoSets[key] || [];
    grid.innerHTML = renderSet(key, items);
  });
}

function setUpBrokenImageHandling() {
  document.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;

      const shot = target.closest(".shot");
      if (!shot) return;

      const grid = shot.closest("[data-grid]");
      shot.remove();

      if (grid && !grid.querySelector(".shot") && !grid.querySelector(".empty-state")) {
        const key = grid.getAttribute("data-grid") || "this section";
        grid.innerHTML = `<p class="empty-state">No images found in ${key}.</p>`;
      }
    },
    true
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getPanLimits(scale = zoomScale) {
  if (!lightboxImage) {
    return { x: 0, y: 0 };
  }

  const baseWidth = lightboxImage.offsetWidth;
  const baseHeight = lightboxImage.offsetHeight;
  const limitX = Math.max(0, (baseWidth * scale - baseWidth) / 2);
  const limitY = Math.max(0, (baseHeight * scale - baseHeight) / 2);
  return { x: limitX, y: limitY };
}

function applyZoomTransform() {
  if (!lightboxImage) return;

  const limits = getPanLimits();
  zoomX = clamp(zoomX, -limits.x, limits.x);
  zoomY = clamp(zoomY, -limits.y, limits.y);
  lightboxImage.style.transform = `translate3d(${zoomX}px, ${zoomY}px, 0) scale(${zoomScale})`;
  lightboxImage.style.cursor = zoomScale > MIN_ZOOM ? (isPanning ? "grabbing" : "grab") : "pointer";
}

function resetZoom() {
  zoomScale = MIN_ZOOM;
  zoomX = 0;
  zoomY = 0;
  isPanning = false;
  gestureMoved = false;
  pinchStartDistance = 0;
  pinchStartScale = 1;
  activePointers.clear();
  applyZoomTransform();
}

function setZoom(nextScale, focusX = null, focusY = null) {
  if (!lightboxImage) return;

  const previousScale = zoomScale;
  zoomScale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM);

  if (zoomScale === MIN_ZOOM) {
    zoomX = 0;
    zoomY = 0;
    applyZoomTransform();
    return;
  }

  if (focusX !== null && focusY !== null && previousScale > 0) {
    const rect = lightboxImage.getBoundingClientRect();
    const localX = focusX - (rect.left + rect.width / 2);
    const localY = focusY - (rect.top + rect.height / 2);
    const ratio = zoomScale / previousScale;
    zoomX = (zoomX + localX) * ratio - localX;
    zoomY = (zoomY + localY) * ratio - localY;
  }

  applyZoomTransform();
}

function pointerDistance(pointerA, pointerB) {
  return Math.hypot(pointerA.x - pointerB.x, pointerA.y - pointerB.y);
}

function clearClickNavTimer() {
  if (clickNavTimer !== null) {
    window.clearTimeout(clickNavTimer);
    clickNavTimer = null;
  }
}

function renderLightboxImage() {
  const setItems = photoSets[activeLightboxSet] || [];
  if (!setItems.length || !lightboxImage) return;

  const safeIndex = ((activeLightboxIndex % setItems.length) + setItems.length) % setItems.length;
  const item = setItems[safeIndex];

  activeLightboxIndex = safeIndex;
  lightboxImage.src = item.src;
  lightboxImage.alt = item.alt;
  resetZoom();
  lightboxImage.addEventListener("load", resetZoom, { once: true });
}

function openLightbox(setKey, index) {
  const setItems = photoSets[setKey] || [];
  if (!setItems.length || !lightbox) return;

  activeLightboxSet = setKey;
  activeLightboxIndex = index;
  clearClickNavTimer();
  renderLightboxImage();

  if (!lightbox.open && typeof lightbox.showModal === "function") {
    lightbox.showModal();
    setLightboxPageState(true);
  } else if (lightbox.open) {
    setLightboxPageState(true);
  }
}

function closeLightbox() {
  clearClickNavTimer();
  setLightboxPageState(false);

  if (lightbox?.open) {
    lightbox.close();
  }

  resetZoom();
  const focused = document.activeElement;
  if (focused instanceof HTMLElement) {
    focused.blur();
  }
}

function moveLightbox(step) {
  const setItems = photoSets[activeLightboxSet] || [];
  if (!setItems.length) return;

  activeLightboxIndex += step;
  renderLightboxImage();
}

function activateTab(tabName) {
  activeTabName = tabName;
  let activeTabButton = null;

  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;

    if (isActive) {
      activeTabButton = tab;
    }
  });

  panels.forEach((panel) => {
    const isMatch = panel.dataset.panel === tabName;
    panel.hidden = !isMatch;
    panel.classList.toggle("is-active", isMatch);
  });

  if (activeTabButton && window.matchMedia("(max-width: 940px)").matches) {
    activeTabButton.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  window.requestAnimationFrame(updateMobileMetaVisibility);
}

function setUpGalleryOpen() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    const trigger = target instanceof Element ? target.closest(".shot-open") : null;
    if (!trigger) return;

    const setKey = trigger.dataset.set;
    const index = Number(trigger.dataset.index || "0");
    openLightbox(setKey, index);
  });
}

function setUpLightbox() {
  lightboxCloseButton?.addEventListener("click", closeLightbox);
  lightboxPrevButton?.addEventListener("click", () => {
    clearClickNavTimer();
    moveLightbox(-1);
  });
  lightboxNextButton?.addEventListener("click", () => {
    clearClickNavTimer();
    moveLightbox(1);
  });
  lightbox?.addEventListener("close", () => {
    setLightboxPageState(false);
    clearClickNavTimer();
    resetZoom();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox?.open) return;

    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") {
      clearClickNavTimer();
      moveLightbox(-1);
    }
    if (event.key === "ArrowRight") {
      clearClickNavTimer();
      moveLightbox(1);
    }
    if (event.key === "+" || event.key === "=") setZoom(zoomScale + 0.25, window.innerWidth / 2, window.innerHeight / 2);
    if (event.key === "-" || event.key === "_") setZoom(zoomScale - 0.25, window.innerWidth / 2, window.innerHeight / 2);
    if (event.key === "0") resetZoom();
  });

  lightbox?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const clickedImage = event.target === lightboxImage;
    const clickedControl = target.closest("[data-lightbox-prev], [data-lightbox-next], [data-lightbox-close]");
    if (clickedControl) return;

    if (clickedImage) {
      if (gestureMoved) {
        gestureMoved = false;
        return;
      }

      if (zoomScale > MIN_ZOOM) return;
      if (event.detail > 1) return;

      const rect = lightboxImage.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      clearClickNavTimer();
      clickNavTimer = window.setTimeout(() => {
        moveLightbox(relativeX >= rect.width / 2 ? 1 : -1);
        clickNavTimer = null;
      }, 170);
      return;
    }

    closeLightbox();
  });

  lightbox?.addEventListener(
    "wheel",
    (event) => {
      if (!lightbox.open) return;

      const target = event.target;
      if (target !== lightboxImage) return;

      event.preventDefault();
      const zoomDelta = event.deltaY < 0 ? 0.2 : -0.2;
      setZoom(zoomScale + zoomDelta, event.clientX, event.clientY);
    },
    { passive: false }
  );

  lightboxImage?.addEventListener("dblclick", (event) => {
    clearClickNavTimer();
    event.preventDefault();

    if (zoomScale === MIN_ZOOM) {
      setZoom(2, event.clientX, event.clientY);
      return;
    }

    resetZoom();
  });

  lightboxImage?.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!lightboxImage) return;

    clearClickNavTimer();
    lightboxImage.setPointerCapture(event.pointerId);
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    gestureMoved = false;

    if (activePointers.size === 1) {
      touchStartX = event.clientX;
      touchStartY = event.clientY;
      if (zoomScale > MIN_ZOOM) {
        isPanning = true;
        panStartX = event.clientX;
        panStartY = event.clientY;
        panOriginX = zoomX;
        panOriginY = zoomY;
        applyZoomTransform();
      }
    }

    if (activePointers.size === 2) {
      const pointers = [...activePointers.values()];
      pinchStartDistance = pointerDistance(pointers[0], pointers[1]) || 1;
      pinchStartScale = zoomScale;
      isPanning = false;
    }
  });

  lightboxImage?.addEventListener("pointermove", (event) => {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.size === 2) {
      const pointers = [...activePointers.values()];
      const distance = pointerDistance(pointers[0], pointers[1]);
      if (!pinchStartDistance) return;

      const centerX = (pointers[0].x + pointers[1].x) / 2;
      const centerY = (pointers[0].y + pointers[1].y) / 2;
      setZoom(pinchStartScale * (distance / pinchStartDistance), centerX, centerY);
      gestureMoved = true;
      return;
    }

    if (activePointers.size === 1 && isPanning && zoomScale > MIN_ZOOM) {
      zoomX = panOriginX + (event.clientX - panStartX);
      zoomY = panOriginY + (event.clientY - panStartY);
      applyZoomTransform();
      gestureMoved = true;
    }

    if (activePointers.size === 1 && zoomScale === MIN_ZOOM && !isPanning) {
      const deltaX = event.clientX - touchStartX;
      const deltaY = event.clientY - touchStartY;
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        gestureMoved = true;
      }
    }
  });

  const handlePointerEnd = (event) => {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.delete(event.pointerId);

    if (activePointers.size < 2) {
      pinchStartDistance = 0;
      pinchStartScale = zoomScale;
    }

    if (activePointers.size === 1 && zoomScale > MIN_ZOOM) {
      const [remainingPointer] = [...activePointers.values()];
      isPanning = true;
      panStartX = remainingPointer.x;
      panStartY = remainingPointer.y;
      panOriginX = zoomX;
      panOriginY = zoomY;
      applyZoomTransform();
      return;
    }

    if (activePointers.size === 0) {
      if (zoomScale === MIN_ZOOM && event.type === "pointerup") {
        const deltaX = event.clientX - touchStartX;
        const deltaY = event.clientY - touchStartY;
        if (Math.abs(deltaX) > 45 && Math.abs(deltaY) < 70) {
          moveLightbox(deltaX < 0 ? 1 : -1);
          gestureMoved = true;
        }
      }

      isPanning = false;
      applyZoomTransform();
    }
  };

  lightboxImage?.addEventListener("pointerup", handlePointerEnd);
  lightboxImage?.addEventListener("pointercancel", handlePointerEnd);
}

function setUpTabs() {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activateTab(tab.dataset.tab);
    });

    tab.addEventListener("keydown", (event) => {
      const key = event.key;
      const currentIndex = tabs.indexOf(tab);
      let nextIndex = currentIndex;

      if (key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
      if (key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      if (key === "Home") nextIndex = 0;
      if (key === "End") nextIndex = tabs.length - 1;

      if (nextIndex !== currentIndex) {
        event.preventDefault();
        const nextTab = tabs[nextIndex];
        nextTab.focus();
        activateTab(nextTab.dataset.tab);
      }
    });
  });
}

async function init() {
  await loadPhotoSets();
  renderGrids();
  setUpBrokenImageHandling();
  setUpGalleryOpen();
  setUpLightbox();
  setUpTabs();
  setUpMobileMetaVisibility();
  activateTab(activeTabName);
}

init();
