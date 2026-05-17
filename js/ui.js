// js/ui.js
/*(function () {
    let selectedId = null;

    const titleEl = document.getElementById("pTitle");
    const descEl = document.getElementById("pDesc");
    const detailBtn = document.getElementById("detailBtn");
    const favBtn = document.getElementById("favBtn");
    const clearBtn = document.getElementById("clearBtn");

    function clearSelection() {
        selectedId = null;

        if (titleEl) titleEl.textContent = "Klikni na objekt";
        if (descEl) descEl.textContent = "Vyber si budovu v scéne a zobrazí sa popis.";
        if (detailBtn) detailBtn.disabled = true;
        if (favBtn) favBtn.disabled = true;
    }

    // bude volať scene.js po kliknutí na objekt
    window.selectBuilding = function (id) {
        const info = window.BUILDINGS && window.BUILDINGS[id];
        if (!info) return;

        selectedId = id;

        if (titleEl) titleEl.textContent = info.name || "Budova";
        if (descEl) descEl.textContent = info.desc || "";

        if (detailBtn) {
            detailBtn.disabled = false;
            detailBtn.onclick = () => {
                window.location.href = "building.html?id=" + encodeURIComponent(id);
            };
        }

        if (favBtn) favBtn.disabled = false;
    };

    function addToFavorites() {
        if (!selectedId) return;

        const fav = JSON.parse(localStorage.getItem("favorites") || "[]");
        if (!fav.includes(selectedId)) {
            fav.push(selectedId);
            localStorage.setItem("favorites", JSON.stringify(fav));
            alert("Pridané do obľúbených!");
        } else {
            alert("Už je v obľúbených!");
        }
    }

    if (favBtn) favBtn.addEventListener("click", addToFavorites);
    if (clearBtn) clearBtn.addEventListener("click", clearSelection);

    clearSelection();
})();
*/
// js/ui.js
(function () {
    // Legacy stub.
    // Основной UI теперь управляется через:
    // - js/buildingsController.js
    // - js/sidebar.js
    // Этот файл специально ничего не переопределяет,
    // чтобы не ломать window.selectBuilding и переключение моделей.
})();