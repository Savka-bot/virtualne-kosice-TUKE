(function () {
  const store = window.appStore;

  function setBuildingSelection(id, { openSidebar = false } = {}) {
    if (!store) return;

    if (!id || !(window.BUILDINGS && window.BUILDINGS[id])) {
      store.setSelectedBuilding(null, { openSidebar: false });
      return;
    }

    store.setSelectedBuilding(id, { openSidebar: !!openSidebar });
  }

  function loadSceneBuilding(id) {
    if (typeof window.loadBuilding === "function") {
      window.loadBuilding(id);
    }
  }

  window.goToBuildingZone = function goToBuildingZone(id) {
    loadSceneBuilding(id);
    setBuildingSelection(id, { openSidebar: true });

    if (typeof window.teleportToBuilding === "function") {
      window.teleportToBuilding(id);
    }
  };

  window.selectBuilding = function selectBuilding(id, opts = {}) {
    setBuildingSelection(id, { openSidebar: true });

    if (opts && opts.reloadModel) {
      loadSceneBuilding(id);
    }
  };

  window.clearSelectedBuilding = function clearSelectedBuilding() {
    if (store) {
      store.setSelectedBuilding(null, { openSidebar: false });
    }
  };
})();