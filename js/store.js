(function () {
  // Централизованное состояние (в первую очередь selectedBuilding).
  const state = {
    selectedBuildingId: null,
    sidebarOpen: false,
    language: "sk",
    isTeleporting: false,
  };

  const listeners = new Set();

  function emit() {
    for (const l of listeners) l(state);
  }

  function getState() {
    return state;
  }

  function setSelectedBuilding(id, { openSidebar = false } = {}) {
    state.selectedBuildingId = id || null;
    if (openSidebar) state.sidebarOpen = true;
    emit();
  }

  function setSidebarOpen(open) {
    state.sidebarOpen = !!open;
    emit();
  }

  function setLanguage(lang) {
    state.language = lang || "sk";
    emit();
  }

  function setTeleporting(flag) {
    state.isTeleporting = !!flag;
    emit();
  }

  function subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    listeners.add(listener);
    // сразу синхронизируем текущее состояние
    listener(state);
    return () => listeners.delete(listener);
  }

  window.appStore = {
    getState,
    setSelectedBuilding,
    setSidebarOpen,
    setLanguage,
    setTeleporting,
    subscribe,
  };
})();

