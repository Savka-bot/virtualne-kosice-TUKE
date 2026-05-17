(function () {
  const store = window.appStore;
  const buildings = window.BUILDINGS;

  const uiEl = document.getElementById("ui");
  const titleEl = document.getElementById("pTitle");
  const descEl = document.getElementById("pDesc");
  const detailBtn = document.getElementById("detailBtn");
  const favBtn = document.getElementById("favBtn");
  const clearBtn = document.getElementById("clearBtn");
  const sourceLinkEl = document.getElementById("sourceLink");
  const audioSkEl = document.getElementById("audioSk");
  const audioEnEl = document.getElementById("audioEn");
  const audioSkEmptyEl = document.getElementById("audioSkEmpty");
  const audioEnEmptyEl = document.getElementById("audioEnEmpty");

  const zoneNavEl = document.getElementById("zoneNav");

  const metaToggleEl = document.getElementById("buildingMetaToggle");
  const metaBodyEl = document.getElementById("buildingMetaBody");
  const metaChevronEl = document.getElementById("buildingMetaChevron");
  const metaLocationEl = document.getElementById("metaLocation");
  const metaTypeEl = document.getElementById("metaType");
  const metaStyleEl = document.getElementById("metaStyle");
  const metaPeriodEl = document.getElementById("metaPeriod");
  const metaArchitectEl = document.getElementById("metaArchitect");

  const META_FALLBACK = "Neuvedené / Not specified";
  let isMetaOpen = false;

  function tDesc(building) {
    const lang = store && store.getState ? store.getState().language : "sk";
    if (!building) return "";
    if (lang === "en") return building.descriptionEN || building.descriptionSK || "";
    return building.descriptionSK || building.descriptionEN || "";
  }

  function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
  }

  function saveFavorites(arr) {
    localStorage.setItem("favorites", JSON.stringify(arr));
  }

  function addToFavorites(id) {
    const building = window.BUILDINGS && window.BUILDINGS[id];
    if (!building) return;

    const fav = getFavorites();
    if (!fav.includes(id)) {
      fav.push(id);
      saveFavorites(fav);
      alert("Pridané do obľúbených!");
    } else {
      alert("Už je v obľúbených!");
    }
  }

  function setUiOpen(open) {
    if (!uiEl) return;
    uiEl.classList.toggle("is-open", !!open);
  }

  function setMetaOpen(open) {
    isMetaOpen = !!open;

    if (metaBodyEl) {
      metaBodyEl.classList.toggle("is-collapsed", !isMetaOpen);
      metaBodyEl.classList.toggle("is-open", isMetaOpen);
    }

    if (metaToggleEl) {
      metaToggleEl.setAttribute("aria-expanded", isMetaOpen ? "true" : "false");
    }

    if (metaChevronEl) {
      metaChevronEl.classList.toggle("is-open", isMetaOpen);
    }
  }

  function setMetaField(el, value) {
    if (!el) return;
    const safe = value && String(value).trim() ? String(value).trim() : META_FALLBACK;
    el.textContent = safe;
  }

  function setMetadata(building) {
    const meta = building && building.metadata ? building.metadata : null;

    setMetaField(metaLocationEl, meta && meta.location);
    setMetaField(metaTypeEl, meta && meta.type);
    setMetaField(metaStyleEl, meta && meta.architecturalStyle);
    setMetaField(metaPeriodEl, meta && meta.period);
    setMetaField(metaArchitectEl, meta && meta.architect);
  }

  function renderZoneNav() {
    if (!zoneNavEl || !window.BUILDINGS_ZONES) return;

    const zones = window.BUILDINGS_ZONES;
    zoneNavEl.innerHTML = "";

    for (const z of zones) {
      const btn = document.createElement("button");
      btn.className = "zone-btn small-btn";
      btn.type = "button";
      btn.dataset.id = z.id;
      btn.textContent = z.navTitle || z.id;

      btn.addEventListener("click", () => {
        if (typeof window.goToBuildingZone === "function") {
          window.goToBuildingZone(z.id);
        } else if (typeof window.selectBuilding === "function") {
          window.selectBuilding(z.id);
        }
      });

      zoneNavEl.appendChild(btn);
    }
  }

  function updateActiveZone(selectedId) {
    if (!zoneNavEl) return;
    const buttons = zoneNavEl.querySelectorAll(".zone-btn");
    buttons.forEach((b) => {
      b.classList.toggle("is-active", b.dataset.id === selectedId);
    });
  }

  function stopAudio(audioEl) {
    if (!audioEl) return;
    audioEl.pause();
    audioEl.removeAttribute("src");
    audioEl.load();
    audioEl.classList.remove("is-visible");
  }

  function setAudio(audioEl, emptyEl, src) {
    if (!audioEl || !emptyEl) return;

    stopAudio(audioEl);

    if (src) {
      audioEl.src = src;
      audioEl.classList.add("is-visible");
      emptyEl.classList.add("is-hidden");
    } else {
      emptyEl.classList.remove("is-hidden");
    }
  }

  function setSourceLink(building) {
    if (!sourceLinkEl) return;

    const url = building && building.sourceUrl ? building.sourceUrl : "";
    const label = building && building.sourceLabel ? building.sourceLabel : "Zdroj zatiaľ nie je dostupný";

    sourceLinkEl.textContent = label;
    sourceLinkEl.href = url || "#";
    sourceLinkEl.classList.toggle("disabled", !url);
    sourceLinkEl.setAttribute("aria-disabled", url ? "false" : "true");
  }

  function resetUi() {
    if (titleEl) titleEl.textContent = "Klikni na objekt";
    if (descEl) descEl.textContent = "Vyber si budovu v scéne a zobrazí sa popis.";
    if (detailBtn) detailBtn.disabled = true;
    if (favBtn) favBtn.disabled = true;
    setSourceLink(null);
    setAudio(audioSkEl, audioSkEmptyEl, "");
    setAudio(audioEnEl, audioEnEmptyEl, "");
    setMetadata(null);
    setMetaOpen(false);
  }

  function renderSelected() {
    if (!store) return;

    const { selectedBuildingId, sidebarOpen } = store.getState();
    setUiOpen(sidebarOpen && !!selectedBuildingId);
    updateActiveZone(selectedBuildingId);

    const building = selectedBuildingId && buildings ? buildings[selectedBuildingId] : null;

    if (!building) {
      resetUi();
      return;
    }

    if (titleEl) titleEl.textContent = building.title || building.name || "Budova";
    if (descEl) descEl.textContent = tDesc(building);

    setMetadata(building);
    setSourceLink(building);
    setAudio(audioSkEl, audioSkEmptyEl, building.audioSK || "");
    setAudio(audioEnEl, audioEnEmptyEl, building.audioEN || "");

    if (detailBtn) {
      detailBtn.disabled = false;
      detailBtn.onclick = () => {
        window.location.href = "building.html?id=" + encodeURIComponent(selectedBuildingId);
      };
    }

    if (favBtn) {
      favBtn.disabled = false;
      favBtn.onclick = () => addToFavorites(selectedBuildingId);
    }
  }

  function initStaticUi() {
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (typeof window.clearSelectedBuilding === "function") {
          window.clearSelectedBuilding();
        } else if (store) {
          store.setSelectedBuilding(null, { openSidebar: false });
        }
      });
    }

    if (metaToggleEl) {
      metaToggleEl.addEventListener("click", () => {
        setMetaOpen(!isMetaOpen);
      });
    }
  }

  renderZoneNav();
  initStaticUi();
  resetUi();

  if (store) {
    store.subscribe(() => renderSelected());
  }
})();