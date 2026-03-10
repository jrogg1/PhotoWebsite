const photoSets = {
  portraits: [
    {
      src: "assets/images/portfolio/portraits/3R3A0184.jpg",
      alt: "Portrait photo 3R3A0184",
      size: "tall"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A0485.jpg",
      alt: "Portrait photo 3R3A0485",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A0735.jpg",
      alt: "Portrait photo 3R3A0735",
      size: "tall"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A0796.jpg",
      alt: "Portrait photo 3R3A0796",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A0911.jpg",
      alt: "Portrait photo 3R3A0911",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A6304.jpg",
      alt: "Portrait photo 3R3A6304",
      size: "tall"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A8430.jpg",
      alt: "Portrait photo 3R3A8430",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A9677.jpg",
      alt: "Portrait photo 3R3A9677",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A9828.jpg",
      alt: "Portrait photo 3R3A9828",
      size: "wide"
    }
  ],
  places: [
    {
      src: "assets/images/portfolio/places/3F5A6885.jpg",
      alt: "Places photo 3F5A6885",
      size: "tall"
    },
    {
      src: "assets/images/portfolio/places/3F5A6927.jpg",
      alt: "Places photo 3F5A6927",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/places/3F5A6973.jpg",
      alt: "Places photo 3F5A6973",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/places/3F5A7083.jpg",
      alt: "Places photo 3F5A7083",
      size: "tall"
    },
    {
      src: "assets/images/portfolio/places/3F5A7088.jpg",
      alt: "Places photo 3F5A7088",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/places/3F5A7279.jpg",
      alt: "Places photo 3F5A7279",
      size: "wide"
    }
  ],
  animals: [
    {
      src: "assets/images/portfolio/animals/3F5A7468.jpg",
      alt: "Animals photo 3F5A7468",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/animals/3F5A7496.jpg",
      alt: "Animals photo 3F5A7496",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/animals/3F5A9356.jpg",
      alt: "Animals photo 3F5A9356",
      size: "tall"
    },
    {
      src: "assets/images/portfolio/animals/3F5A9642.jpg",
      alt: "Animals photo 3F5A9642",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/animals/3F5A9751.jpg",
      alt: "Animals photo 3F5A9751",
      size: "wide"
    }
  ]
};

const ASSET_VERSION = "20260310b";

function withVersion(src) {
  return `${src}?v=${ASSET_VERSION}`;
}

const tabs = Array.from(document.querySelectorAll(".tab"));
const panels = Array.from(document.querySelectorAll(".panel"));
const grids = Array.from(document.querySelectorAll("[data-grid]"));
const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxCloseButton = document.querySelector("[data-lightbox-close]");
const lightboxPrevButton = document.querySelector("[data-lightbox-prev]");
const lightboxNextButton = document.querySelector("[data-lightbox-next]");
let activeTabName = "portraits";
let activeLightboxSet = "portraits";
let activeLightboxIndex = 0;
let touchStartX = 0;

function renderSet(setKey, items) {
  return items
    .map(
      (item, index) => `
      <figure class="shot">
        <button class="shot-open" type="button" data-set="${setKey}" data-index="${index}" aria-label="Open image ${index + 1}">
          <div class="shot-media shot-media--${item.size}">
            <img src="${withVersion(item.src)}" alt="${item.alt}" loading="lazy" />
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

function renderLightboxImage() {
  const setItems = photoSets[activeLightboxSet] || [];
  if (!setItems.length || !lightboxImage) return;

  const safeIndex = ((activeLightboxIndex % setItems.length) + setItems.length) % setItems.length;
  const item = setItems[safeIndex];

  activeLightboxIndex = safeIndex;
  lightboxImage.src = withVersion(item.src);
  lightboxImage.alt = item.alt;
}

function openLightbox(setKey, index) {
  const setItems = photoSets[setKey] || [];
  if (!setItems.length || !lightbox) return;

  activeLightboxSet = setKey;
  activeLightboxIndex = index;
  renderLightboxImage();

  if (!lightbox.open && typeof lightbox.showModal === "function") {
    lightbox.showModal();
  }
}

function closeLightbox() {
  if (lightbox?.open) {
    lightbox.close();
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
  lightboxPrevButton?.addEventListener("click", () => moveLightbox(-1));
  lightboxNextButton?.addEventListener("click", () => moveLightbox(1));

  document.addEventListener("keydown", (event) => {
    if (!lightbox?.open) return;

    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") moveLightbox(-1);
    if (event.key === "ArrowRight") moveLightbox(1);
  });

  lightbox?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const clickedImage = event.target === lightboxImage;
    const clickedControl = target.closest("[data-lightbox-prev], [data-lightbox-next], [data-lightbox-close]");
    if (clickedImage || clickedControl) return;

    closeLightbox();
  });

  lightbox?.addEventListener("wheel", (event) => {
    if (!lightbox.open) return;

    event.preventDefault();
    moveLightbox(event.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  lightboxImage?.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  lightboxImage?.addEventListener("touchend", (event) => {
    const touchEndX = event.changedTouches[0].clientX;
    const delta = touchEndX - touchStartX;

    if (Math.abs(delta) < 40) return;
    if (delta < 0) moveLightbox(1);
    if (delta > 0) moveLightbox(-1);
  }, { passive: true });
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

function init() {
  renderGrids();
  setUpGalleryOpen();
  setUpLightbox();
  setUpTabs();
  activateTab(activeTabName);
}

init();
