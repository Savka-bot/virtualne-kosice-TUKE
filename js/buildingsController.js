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

  // Нажатие на кнопку справа:
  // 1. удаляем текущую модель и загружаем новую
  // 2. обновляем выбор в store
  // 3. teleport оставляем как fallback, если он где-то еще нужен
  window.goToBuildingZone = function goToBuildingZone(id) {
    loadSceneBuilding(id);
    setBuildingSelection(id, { openSidebar: true });

    if (typeof window.teleportToBuilding === "function") {
      window.teleportToBuilding(id);
    }
  };

  // Клик по самой модели в сцене:
  // только открывает/обновляет карточку, без повторной загрузки
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