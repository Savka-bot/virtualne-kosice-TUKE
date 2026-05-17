(function () {
  const stateByPanel = new WeakMap();

  function initSwipeBar(panel) {
    if (!panel) return;

    const scrollEl = panel.querySelector(":scope > .swipe-scroll");
    const bar = panel.querySelector(":scope > .swipe-bar");
    if (!scrollEl || !bar) return;

    const track = bar.querySelector(".swipe-bar-track");
    const thumb = bar.querySelector(".swipe-bar-thumb");
    if (!track || !thumb) return;

    if (stateByPanel.has(panel)) {
      stateByPanel.get(panel).update();
      return;
    }

    let dragging = false;
    let dragStartY = 0;
    let dragStartScroll = 0;

    function maxScroll() {
      return Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
    }

    function updateSwipeBar() {
      const ms = maxScroll();
      const need = ms > 2;
      bar.classList.toggle("is-visible", need);
      bar.toggleAttribute("hidden", !need);
      panel.classList.toggle("has-swipe-bar", need);
      if (!need) return;

      const trackH = track.clientHeight;
      const ratio = scrollEl.clientHeight / scrollEl.scrollHeight;
      const thumbH = Math.max(36, Math.round(trackH * ratio));
      const travel = Math.max(0, trackH - thumbH);
      const top = ms <= 0 ? 0 : (scrollEl.scrollTop / ms) * travel;

      thumb.style.height = `${thumbH}px`;
      thumb.style.top = `${top}px`;

      const pct = ms <= 0 ? 0 : Math.round((scrollEl.scrollTop / ms) * 100);
      bar.setAttribute("aria-valuenow", String(pct));
    }

    function onScroll() {
      updateSwipeBar();
    }

    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateSwipeBar);

    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateSwipeBar);
      ro.observe(scrollEl);
    }

    function onThumbDown(e) {
      if (bar.hidden) return;
      e.preventDefault();
      dragging = true;
      dragStartY = e.clientY;
      dragStartScroll = scrollEl.scrollTop;
      thumb.setPointerCapture(e.pointerId);
    }

    function onThumbMove(e) {
      if (!dragging) return;
      const ms = maxScroll();
      const trackH = track.clientHeight;
      const thumbH = thumb.offsetHeight;
      const travel = Math.max(1, trackH - thumbH);
      const dy = e.clientY - dragStartY;
      scrollEl.scrollTop = dragStartScroll + (dy / travel) * ms;
    }

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      try {
        thumb.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    function onTrackClick(e) {
      if (e.target === thumb || thumb.contains(e.target)) return;
      const ms = maxScroll();
      if (ms <= 0) return;
      const rect = track.getBoundingClientRect();
      const thumbH = thumb.offsetHeight;
      const trackH = rect.height;
      const travel = Math.max(0, trackH - thumbH);
      const clickY = e.clientY - rect.top;
      let thumbTop = clickY - thumbH / 2;
      thumbTop = Math.max(0, Math.min(travel, thumbTop));
      scrollEl.scrollTop = (thumbTop / travel) * ms;
    }

    thumb.addEventListener("pointerdown", onThumbDown);
    thumb.addEventListener("pointermove", onThumbMove);
    thumb.addEventListener("pointerup", endDrag);
    thumb.addEventListener("pointercancel", endDrag);
    track.addEventListener("click", onTrackClick);

    stateByPanel.set(panel, {
      update: updateSwipeBar,
      destroy: function () {
        scrollEl.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", updateSwipeBar);
        if (ro) ro.disconnect();
        thumb.removeEventListener("pointerdown", onThumbDown);
        thumb.removeEventListener("pointermove", onThumbMove);
        thumb.removeEventListener("pointerup", endDrag);
        thumb.removeEventListener("pointercancel", endDrag);
        track.removeEventListener("click", onTrackClick);
        stateByPanel.delete(panel);
      },
    });

    updateSwipeBar();
  }

  function initAll() {
    document.querySelectorAll(".swipe-panel").forEach(initSwipeBar);
  }

  function refreshAll() {
    document.querySelectorAll(".swipe-panel").forEach((panel) => {
      const s = stateByPanel.get(panel);
      if (s && s.update) s.update();
      else initSwipeBar(panel);
    });
  }

  window.initSwipeBars = initAll;
  window.refreshSwipeBars = refreshAll;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
