const photoSets = {
  portraits: [
    {
      src: "assets/images/portfolio/portraits/3R3A0184.jpg",
      alt: "Portrait photo 3R3A0184",
      title: "Portrait 01",
      meta: "Portraits",
      size: "tall"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A0325.jpg",
      alt: "Portrait photo 3R3A0325",
      title: "Portrait 02",
      meta: "Portraits",
      size: "tall"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A0485.jpg",
      alt: "Portrait photo 3R3A0485",
      title: "Portrait 03",
      meta: "Portraits",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A0681.jpg",
      alt: "Portrait photo 3R3A0681",
      title: "Portrait 04",
      meta: "Portraits",
      size: "tall"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A0735.jpg",
      alt: "Portrait photo 3R3A0735",
      title: "Portrait 05",
      meta: "Portraits",
      size: "tall"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A0796.jpg",
      alt: "Portrait photo 3R3A0796",
      title: "Portrait 06",
      meta: "Portraits",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A0911.jpg",
      alt: "Portrait photo 3R3A0911",
      title: "Portrait 07",
      meta: "Portraits",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A6304.jpg",
      alt: "Portrait photo 3R3A6304",
      title: "Portrait 08",
      meta: "Portraits",
      size: "tall"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A8430.jpg",
      alt: "Portrait photo 3R3A8430",
      title: "Portrait 09",
      meta: "Portraits",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A9677.jpg",
      alt: "Portrait photo 3R3A9677",
      title: "Portrait 10",
      meta: "Portraits",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/portraits/3R3A9828.jpg",
      alt: "Portrait photo 3R3A9828",
      title: "Portrait 11",
      meta: "Portraits",
      size: "wide"
    }
  ],
  places: [
    {
      src: "assets/images/portfolio/places/3F5A6885.jpg",
      alt: "Places photo 3F5A6885",
      title: "Place 01",
      meta: "Places",
      size: "tall"
    },
    {
      src: "assets/images/portfolio/places/3F5A6927.jpg",
      alt: "Places photo 3F5A6927",
      title: "Place 02",
      meta: "Places",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/places/3F5A6973.jpg",
      alt: "Places photo 3F5A6973",
      title: "Place 03",
      meta: "Places",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/places/3F5A7083.jpg",
      alt: "Places photo 3F5A7083",
      title: "Place 04",
      meta: "Places",
      size: "tall"
    },
    {
      src: "assets/images/portfolio/places/3F5A7088.jpg",
      alt: "Places photo 3F5A7088",
      title: "Place 05",
      meta: "Places",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/places/3F5A7279.jpg",
      alt: "Places photo 3F5A7279",
      title: "Place 06",
      meta: "Places",
      size: "wide"
    }
  ],
  animals: [
    {
      src: "assets/images/portfolio/animals/3F5A7468.jpg",
      alt: "Animals photo 3F5A7468",
      title: "Animal 01",
      meta: "Animals",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/animals/3F5A7496.jpg",
      alt: "Animals photo 3F5A7496",
      title: "Animal 02",
      meta: "Animals",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/animals/3F5A9356.jpg",
      alt: "Animals photo 3F5A9356",
      title: "Animal 03",
      meta: "Animals",
      size: "tall"
    },
    {
      src: "assets/images/portfolio/animals/3F5A9642.jpg",
      alt: "Animals photo 3F5A9642",
      title: "Animal 04",
      meta: "Animals",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/animals/3F5A9751.jpg",
      alt: "Animals photo 3F5A9751",
      title: "Animal 05",
      meta: "Animals",
      size: "wide"
    },
    {
      src: "assets/images/portfolio/animals/_C7A5897.jpg",
      alt: "Animals photo _C7A5897",
      title: "Animal 06",
      meta: "Animals",
      size: "wide"
    }
  ]
};

const tabs = Array.from(document.querySelectorAll(".tab"));
const panels = Array.from(document.querySelectorAll(".panel"));
const grids = Array.from(document.querySelectorAll("[data-grid]"));
let activeTabName = "portraits";

function renderSet(items) {
  return items
    .map(
      (item) => `
      <figure class="shot">
        <div class="shot-media shot-media--${item.size}">
          <img src="${item.src}" alt="${item.alt}" loading="lazy" />
        </div>
        <figcaption>
          <p class="shot-title">${item.title}</p>
          <p class="shot-meta">${item.meta}</p>
        </figcaption>
      </figure>
    `
    )
    .join("");
}

function renderGrids() {
  grids.forEach((grid) => {
    const key = grid.dataset.grid;
    const items = photoSets[key] || [];
    grid.innerHTML = renderSet(items);
  });
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
  setUpTabs();
  activateTab(activeTabName);
}

init();
