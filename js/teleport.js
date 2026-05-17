(function () {
  function getRig() {
    return document.getElementById("rig");
  }

  window.teleportToBuilding = function teleportToBuilding(id) {
    const cfg = window.BUILDINGS && window.BUILDINGS[id];
    const rig = getRig();
    const store = window.appStore;
    if (!cfg || !cfg.teleport || !rig || !store) return;

    // Чтобы collision-тick не "откатывал" позицию обратно.
    store.setTeleporting(true);

    rig.setAttribute("position", cfg.teleport.position);
    if (typeof cfg.teleport.rotationY === "number") {
      rig.setAttribute("rotation", `0 ${cfg.teleport.rotationY} 0`);
    }

    // Гарантируем, что флаг снимется после применения трансформации.
    window.setTimeout(() => {
      store.setTeleporting(false);
    }, 700);
  };
})();

