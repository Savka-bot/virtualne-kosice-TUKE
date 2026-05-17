(function () {
    const scene = document.querySelector("a-scene");
    if (!scene) return;

    const debugEl = document.getElementById("sceneDebugStatus");

    function setDebug(msg) {
        if (debugEl) debugEl.textContent = msg;
        console.log("[3dscene]", msg);
    }

    window.addEventListener("error", function (e) {
        setDebug("JS error: " + (e.message || "unknown"));
    });

    function initSceneRuntime() {
        setDebug("Skript beží · čakám na scénu…");

        const cameraEl = scene.querySelector("[camera]");
        const rig = document.getElementById("rig");
        const buildingsRoot = document.getElementById("buildingsRoot");
        const rotateBtn = document.getElementById("rotateBtn");
        const presentationAnchor = document.getElementById("presentationAnchor");
        const museumPodium = document.getElementById("museumPodium");
        const focusRing = document.getElementById("focusRing");
        const fakeShadow = document.getElementById("fakeShadow");

        const pTitle = document.getElementById("pTitle");
        const pDesc = document.getElementById("pDesc");
        const pWikiInfo = document.getElementById("pWikiInfo");
        const metaLocation = document.getElementById("metaLocation");
        const metaType = document.getElementById("metaType");
        const metaStyle = document.getElementById("metaStyle");
        const metaPeriod = document.getElementById("metaPeriod");
        const metaArchitect = document.getElementById("metaArchitect");
        const sourceLink = document.getElementById("sourceLink");
        const sourceNoteEl = document.getElementById("sourceNote");
        const audioSk = document.getElementById("audioSk");
        const audioEn = document.getElementById("audioEn");
        const audioSkEmpty = document.getElementById("audioSkEmpty");
        const audioEnEmpty = document.getElementById("audioEnEmpty");
        const uiPanel = document.getElementById("ui");

        const zoneModelsHeading = document.getElementById("zoneModelsHeading");
        const zoneModelsSubtext = document.getElementById("zoneModelsSubtext");
        const zoneModelsList = document.getElementById("zoneModelsList");

        const cameraModeButtons = Array.from(document.querySelectorAll(".camera-mode-btn"));
        const navModeButtons = Array.from(document.querySelectorAll(".nav-mode-btn"));
        const cameraModeHint = document.getElementById("cameraModeHint");
        const favBtn = document.getElementById("favBtn");

        let currentBuildingId = null;
        let currentZoneId = "";
        let currentContainerEl = null;
        let currentModelEl = null;
        let currentBuildingCfg = null;
        let autoRotateEnabled = false;
        let currentCameraMode = "side1";
        let currentNavMode = "orbit";
        let lastSafe = null;
        let pendingActivationId = null;

        const modelRegistry = new Map();
        const modelOrder = [];
        const modelBoundsById = new Map();
        const tmpVecA = new THREE.Vector3();
        const tmpVecB = new THREE.Vector3();
        const raycaster = new THREE.Raycaster();

        const ARENA = { minX: -30, maxX: 30, minZ: -30, maxZ: 10 };
        const BOUNDS = { minX: -35, maxX: 35, minZ: -35, maxZ: 15 };
        const PRESENTATION_DISTANCE = 8.5;
        const DOME_RADIUS = 46;
        const MODEL_COLLIDER_PADDING = 2.8;
        const PODIUM_HEIGHT = 0.32;
        const MODEL_LIFT = 0.03;

        const presentationOrbitState = {
            isDragging: false,
            pointerId: null,
            startX: 0,
            startY: 0,
            yawOffset: 0,
            pitchOffset: 0,
            baseYaw: 0,
            basePitch: -0.38,
            /** Zoom v režime Orbit (násobok vzdialenosti z getFramingFromModel). */
            orbitDistanceScale: 1,
        };

        function clamp(v, min, max) {
            return Math.min(max, Math.max(min, v));
        }

        // Required 3D distance formula:
        // d = sqrt((x2-x1)^2 + (y2-y1)^2 + (z2-z1)^2)
        function distance3D(a, b) {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dz = b.z - a.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        }

        function getSceneSlot(index, total) {
            const count = Math.max(total || 1, 1);
            const radius = count <= 4 ? 15 : 20;
            const angle = (index / count) * Math.PI * 2;
            return {
                x: Math.cos(angle) * radius,
                y: 0,
                z: Math.sin(angle) * radius,
                yawDeg: THREE.MathUtils.radToDeg(angle + Math.PI),
            };
        }

        function getParams() {
            const params = new URLSearchParams(window.location.search);
            const urlZone = params.get("zone") || "";
            const urlId = params.get("id") || "";

            let savedZone = "";
            let savedId = "";

            try {
                const saved = JSON.parse(localStorage.getItem("selectedSceneBuilding") || "null");
                savedZone = saved && saved.zone ? saved.zone : "";
                savedId = saved && saved.id ? saved.id : "";
            } catch (error) {
                console.warn("Failed to read selectedSceneBuilding from localStorage:", error);
            }

            return {
                zone: urlZone || savedZone,
                id: urlId || savedId,
            };
        }

        function getBuildingCollection() {
            if (!window.BUILDINGS) return [];
            if (Array.isArray(window.BUILDINGS)) return window.BUILDINGS;
            if (typeof window.BUILDINGS === "object") {
                return Object.entries(window.BUILDINGS).map(([id, value]) => ({
                    id,
                    ...value,
                }));
            }
            return [];
        }

        function getBuildingById(zone, id) {
            return (
                getBuildingCollection().find((item) => {
                    const itemId = item.id || item.key || "";
                    const itemZone = item.zone || "";
                    return itemId === id && itemZone === zone;
                }) || null
            );
        }

        function getDefaultBuilding() {
            const allBuildings = getBuildingCollection();
            return allBuildings.length > 0 ? allBuildings[0] : null;
        }

        function getBuildingsByZone(zone) {
            if (!zone) return [];
            return getBuildingCollection().filter((item) => (item.zone || "") === zone);
        }

        function getZoneLabel(zone) {
            const labels = {
                "historicke-centrum": "Historické centrum",
                "univerzitna-zona": "Univerzitná zóna",
                "mestska-zona": "Mestská zóna",
            };
            return labels[zone] || zone || "Vybraná lokalita";
        }

        function rememberSelectedBuilding(zone, id) {
            try {
                localStorage.setItem("selectedSceneBuilding", JSON.stringify({ zone, id }));
            } catch (error) {
                console.warn("Failed to store selectedSceneBuilding:", error);
            }
        }

        function getFavorites() {
            try {
                const raw = JSON.parse(localStorage.getItem("favorites") || "[]");
                return Array.isArray(raw) ? raw : [];
            } catch (error) {
                console.warn("Failed to read favorites:", error);
                return [];
            }
        }

        function saveFavorites(arr) {
            try {
                localStorage.setItem("favorites", JSON.stringify(arr));
            } catch (error) {
                console.warn("Failed to save favorites:", error);
            }
        }

        function updateFavButtonState() {
            if (!favBtn) return;
            const canSave = !!currentBuildingId;
            favBtn.disabled = !canSave;
            if (!canSave) {
                favBtn.textContent = "⭐ Uložiť";
                return;
            }
            const isSaved = getFavorites().includes(currentBuildingId);
            favBtn.textContent = isSaved ? "⭐ V obľúbených" : "⭐ Uložiť";
        }

        function addCurrentToFavorites() {
            if (!currentBuildingId) return;
            const fav = getFavorites();
            if (!fav.includes(currentBuildingId)) {
                fav.push(currentBuildingId);
                saveFavorites(fav);
                alert("Pridané do obľúbených!");
            } else {
                alert("Už je v obľúbených!");
            }
            updateFavButtonState();
        }

        function renderZoneModels(zone, activeId) {
            if (!zoneModelsList) return;

            const zoneBuildings = getBuildingsByZone(zone);
            zoneModelsList.innerHTML = "";

            if (zoneModelsHeading) zoneModelsHeading.textContent = getZoneLabel(zone);

            if (zoneModelsSubtext) {
                zoneModelsSubtext.textContent = zoneBuildings.length
                    ? "Kliknutím prepneš zobrazený model v rámci tejto lokality."
                    : "Pre túto lokalitu zatiaľ nie sú dostupné ďalšie modely.";
            }

            zoneBuildings.forEach((building) => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "zone-model-item" + ((building.id || building.key) === activeId ? " is-active" : "");

                const title = document.createElement("div");
                title.className = "zone-model-item-title";
                title.textContent = building.name || building.title || "Bez názvu";

                const desc = document.createElement("div");
                desc.className = "zone-model-item-desc";
                desc.textContent = building.description || building.desc || "Popis zatiaľ nie je dostupný.";

                const sourceLine = document.createElement("div");
                sourceLine.className = "zone-model-item-source";
                sourceLine.textContent =
                    (building.sourceNote || building.sourceDescription || "").trim() ||
                    "Zdroj: vlastný 3D model projektu Virtuálne Košice.";

                btn.appendChild(title);
                btn.appendChild(desc);
                btn.appendChild(sourceLine);

                btn.addEventListener("click", () => {
                    const selectedId = building.id || building.key;
                    const selectedZone = building.zone || zone || "";
                    rememberSelectedBuilding(selectedZone, selectedId);
                    loadBuilding(selectedId, selectedZone);
                });

                zoneModelsList.appendChild(btn);
            });

            if (typeof window.refreshSwipeBars === "function") {
                window.requestAnimationFrame(() => window.refreshSwipeBars());
            }
        }

        function getModelUrl(cfg) {
            return cfg.modelPath || cfg.modelUrl || cfg.url || "";
        }

        function getModelFallbackUrl(cfg) {
            return cfg.modelUrlFallback || cfg.modelPathFallback || "";
        }

        function normalizeModelPivot(modelEl, groundOffsetY, pivotOpts) {
            const opts = pivotOpts || {};
            const mesh = modelEl.getObject3D("mesh");
            if (!mesh) return;

            mesh.updateMatrixWorld(true);

            if (opts.centerModelXZ) {
                const boxXZ = new THREE.Box3().setFromObject(mesh);
                if (!boxXZ.isEmpty()) {
                    boxXZ.getCenter(tmpVecA);
                    mesh.getWorldPosition(tmpVecB);
                    const dxW = tmpVecB.x - tmpVecA.x;
                    const dzW = tmpVecB.z - tmpVecA.z;
                    if (mesh.parent) {
                        const pq = new THREE.Quaternion();
                        mesh.parent.getWorldQuaternion(pq);
                        const localDelta = new THREE.Vector3(dxW, 0, dzW).applyQuaternion(pq.clone().invert());
                        mesh.position.x += localDelta.x;
                        mesh.position.z += localDelta.z;
                    } else {
                        mesh.position.x += dxW;
                        mesh.position.z += dzW;
                    }
                    mesh.updateMatrixWorld(true);
                }
            }

            const box = new THREE.Box3().setFromObject(mesh);
            if (box.isEmpty()) return;

            mesh.position.y -= box.min.y;
            mesh.position.y += groundOffsetY;
            mesh.position.y += PODIUM_HEIGHT + MODEL_LIFT;

            mesh.updateMatrixWorld(true);
        }

        function getSpawnPositionInFrontOfRig(distance) {
            if (!rig) return { x: 0, y: 0, z: -10 };

            const rigPos = rig.object3D.position;
            const yaw = rig.object3D.rotation.y;
            const forwardX = -Math.sin(yaw);
            const forwardZ = -Math.cos(yaw);

            return {
                x: clamp(rigPos.x + forwardX * distance, ARENA.minX, ARENA.maxX),
                y: 0,
                z: clamp(rigPos.z + forwardZ * distance, ARENA.minZ, ARENA.maxZ),
            };
        }

        function placePresentationAnchor(pos) {
            if (!presentationAnchor) return;
            presentationAnchor.setAttribute("position", `${pos.x} ${pos.y} ${pos.z}`);
        }

        function orientContainerToRig(containerEl, rigEl, yawCorrection) {
            if (!containerEl || !rigEl) return;

            const containerPos = new THREE.Vector3();
            const rigPos = new THREE.Vector3();

            containerEl.object3D.getWorldPosition(containerPos);
            rigEl.object3D.getWorldPosition(rigPos);

            const dx = rigPos.x - containerPos.x;
            const dz = rigPos.z - containerPos.z;
            const yawDeg = THREE.MathUtils.radToDeg(Math.atan2(dx, dz));
            containerEl.setAttribute("rotation", `0 ${yawDeg + (yawCorrection || 0)} 0`);
        }

        function clearCurrentBuilding() {
            modelRegistry.forEach((entry) => {
                if (entry && entry.containerEl) entry.containerEl.setAttribute("visible", false);
            });
            currentContainerEl = null;
            currentModelEl = null;
            currentBuildingId = null;
            currentBuildingCfg = null;
            updateFavButtonState();
        }

        function applyModelEntranceAnimation(el, finalScale) {
            el.setAttribute("scale", "0.01 0.01 0.01");
            el.setAttribute("animation__scalein", {
                property: "scale",
                to: finalScale || "1 1 1",
                dur: 650,
                easing: "easeOutBack",
            });
        }

        function setMeshesShadow(modelEl) {
            const mesh = modelEl.getObject3D("mesh");
            if (!mesh) return;

            mesh.traverse((node) => {
                if (!node.isMesh) return;
                node.castShadow = true;
                node.receiveShadow = true;
                node.frustumCulled = false;

                const materials = Array.isArray(node.material) ? node.material : [node.material];
                materials.forEach((mat) => {
                    if (!mat) return;
                    if (mat.side !== undefined) mat.side = THREE.DoubleSide;
                    if ("needsUpdate" in mat) mat.needsUpdate = true;
                });
            });
        }

        function attachModelPlaceholder(parentEl, buildingId) {
            if (!parentEl) return null;
            const placeholder = document.createElement("a-box");
            placeholder.setAttribute("data-id", `${buildingId || "model"}-placeholder`);
            placeholder.setAttribute("width", "6");
            placeholder.setAttribute("height", "4");
            placeholder.setAttribute("depth", "6");
            placeholder.setAttribute("position", "0 2.4 0");
            placeholder.setAttribute("material", "color: #7aa2ff; metalness: 0.1; roughness: 0.8; opacity: 0.9");
            placeholder.setAttribute("shadow", "cast: true; receive: true");
            parentEl.appendChild(placeholder);
            return placeholder;
        }

        function updatePresentationVisuals() {
            if (museumPodium) museumPodium.setAttribute("visible", true);
            if (focusRing) focusRing.setAttribute("visible", true);
            if (fakeShadow) fakeShadow.setAttribute("visible", true);
        }

        function setText(el, value, fallback) {
            if (!el) return;
            el.textContent = value || fallback;
        }

        function formatWikiInfo(cfg) {
            if (!cfg) return "";
            const sk = (cfg.wikiInfoSK || "").trim();
            const en = (cfg.wikiInfoEN || "").trim();
            if (sk && en) return sk + "\n\n" + en;
            return sk || en;
        }

        function setSourceLink(url, missingModel) {
            if (!sourceLink) return;

            if (url) {
                sourceLink.href = url;
                sourceLink.textContent = "Otvoriť zdroj";
                sourceLink.classList.remove("disabled");
                sourceLink.setAttribute("aria-disabled", "false");
            } else {
                sourceLink.href = "#";
                sourceLink.textContent = missingModel ? "Zdroj zatiaľ nie je dostupný" : "Bez externého odkazu";
                sourceLink.classList.add("disabled");
                sourceLink.setAttribute("aria-disabled", "true");
            }
        }

        function setSourceNote(text) {
            if (!sourceNoteEl) return;
            const t = (text || "").trim();
            if (t) {
                sourceNoteEl.textContent = t;
                sourceNoteEl.hidden = false;
            } else {
                sourceNoteEl.textContent = "";
                sourceNoteEl.hidden = true;
            }
        }

        function setAudio(audioEl, emptyEl, src, emptyText) {
            if (!audioEl || !emptyEl) return;

            if (src) {
                audioEl.src = src;
                audioEl.style.display = "block";
                emptyEl.style.display = "none";
            } else {
                audioEl.removeAttribute("src");
                audioEl.load();
                audioEl.style.display = "none";
                emptyEl.style.display = "block";
                emptyEl.textContent = emptyText;
            }
        }

        function updateSidebar(cfg) {
            if (uiPanel) uiPanel.classList.add("is-open");

            if (!cfg) {
                setText(pTitle, "Model nebol nájdený", "Model nebol nájdený");
                setText(pDesc, "Vybraná budova nemá dostupné údaje.", "Vybraná budova nemá dostupné údaje.");
                setText(pWikiInfo, "", "Text z Wikipédie zatiaľ nie je dostupný. / Wikipedia text not available yet.");
                setText(metaLocation, "", "Neuvedené / Not specified");
                setText(metaType, "", "Neuvedené / Not specified");
                setText(metaStyle, "", "Neuvedené / Not specified");
                setText(metaPeriod, "", "Neuvedené / Not specified");
                setText(metaArchitect, "", "Neuvedené / Not specified");
                setSourceLink("", true);
                setSourceNote("");
                setAudio(audioSk, audioSkEmpty, "", "Audio v slovenčine zatiaľ nie je dostupné.");
                setAudio(audioEn, audioEnEmpty, "", "English audio is not available yet.");
                return;
            }

            setText(pTitle, cfg.name || cfg.title, "Bez názvu");
            setText(pDesc, cfg.description || cfg.desc, "Popis zatiaľ nie je dostupný.");
            setText(
                pWikiInfo,
                formatWikiInfo(cfg),
                "Text z Wikipédie zatiaľ nie je dostupný. / Wikipedia text not available yet."
            );
            setText(metaLocation, cfg.location, "Neuvedené / Not specified");
            setText(metaType, cfg.type, "Neuvedené / Not specified");
            setText(metaStyle, cfg.style, "Neuvedené / Not specified");
            setText(metaPeriod, cfg.period, "Neuvedené / Not specified");
            setText(metaArchitect, cfg.architect, "Neuvedené / Not specified");
            setSourceLink(cfg.sourceUrl || cfg.source || "");
            setSourceNote(cfg.sourceNote || cfg.sourceDescription || "");
            setAudio(audioSk, audioSkEmpty, cfg.audioSk || "", "Audio v slovenčine zatiaľ nie je dostupné.");
            setAudio(audioEn, audioEnEmpty, cfg.audioEn || "", "English audio is not available yet.");
        }

        function setControlsEnabled(enabled) {
            if (!cameraEl) return;

            const lookControls = cameraEl.components && cameraEl.components["look-controls"];
            const wasdControls = cameraEl.components && cameraEl.components["wasd-controls"];

            if (lookControls) {
                lookControls.pause();
                lookControls.enabled = enabled;
                if (enabled) lookControls.play();
            }

            if (wasdControls) {
                wasdControls.pause();
                wasdControls.enabled = enabled;
                if (enabled) wasdControls.play();
            }

            cameraEl.setAttribute("look-controls", `enabled: ${enabled}`);
            cameraEl.setAttribute("wasd-controls", `acceleration: 22; enabled: ${enabled}`);
        }

        function setPresentationControls() {
            if (!cameraEl) return;
            cameraEl.setAttribute("look-controls", "enabled: true");
            cameraEl.setAttribute("wasd-controls", `acceleration: 22; enabled: ${currentNavMode === "walk"}`);
        }

        function setLookControlsEnabled(enabled) {
            if (!cameraEl) return;
            const lookControls = cameraEl.components && cameraEl.components["look-controls"];
            cameraEl.setAttribute("look-controls", `enabled: ${enabled}`);
            if (!lookControls) return;
            lookControls.pause();
            lookControls.enabled = enabled;
            if (enabled) lookControls.play();
        }

        function normalizeAngle(angle) {
            while (angle > Math.PI) angle -= Math.PI * 2;
            while (angle < -Math.PI) angle += Math.PI * 2;
            return angle;
        }

        function getLookTarget() {
            const focusOffset = (currentBuildingCfg && currentBuildingCfg.cameraTargetOffset) || {};
            if (currentModelEl && currentModelEl.getObject3D) {
                const mesh = currentModelEl.getObject3D("mesh");
                if (mesh) {
                    const box = getModelWorldBox(mesh);
                    if (!box.isEmpty()) {
                        const center = new THREE.Vector3();
                        box.getCenter(center);
                        return new THREE.Vector3(
                            center.x + (typeof focusOffset.x === "number" ? focusOffset.x : 0),
                            center.y + (typeof focusOffset.y === "number" ? focusOffset.y : 0),
                            center.z + (typeof focusOffset.z === "number" ? focusOffset.z : 0)
                        );
                    }
                }

                if (currentModelEl.object3D) {
                    const modelPos = new THREE.Vector3();
                    currentModelEl.object3D.getWorldPosition(modelPos);
                    return new THREE.Vector3(
                        modelPos.x + (typeof focusOffset.x === "number" ? focusOffset.x : 0),
                        modelPos.y + (typeof focusOffset.y === "number" ? focusOffset.y : 2.4),
                        modelPos.z + (typeof focusOffset.z === "number" ? focusOffset.z : 0)
                    );
                }
            }

            const stageCenter = new THREE.Vector3();
            if (presentationAnchor) {
                presentationAnchor.object3D.getWorldPosition(stageCenter);
            }
            return new THREE.Vector3(stageCenter.x, stageCenter.y + 2.4, stageCenter.z);
        }

        function getModelWorldBox(meshRoot) {
            const box = new THREE.Box3();
            const tmpBox = new THREE.Box3();
            let hasGeometry = false;

            meshRoot.updateMatrixWorld(true);
            meshRoot.traverse((node) => {
                if (!node.isMesh || !node.geometry || node.visible === false) return;
                const geom = node.geometry;
                if (!geom.boundingBox) geom.computeBoundingBox();
                if (!geom.boundingBox) return;
                tmpBox.copy(geom.boundingBox).applyMatrix4(node.matrixWorld);
                if (!hasGeometry) {
                    box.copy(tmpBox);
                    hasGeometry = true;
                } else {
                    box.union(tmpBox);
                }
            });

            if (!hasGeometry) box.makeEmpty();
            return box;
        }

        function getFramingFromModel() {
            const defaults = { distance: 22, height: 14, topHeight: 42 };
            if (!currentModelEl) return defaults;

            const mesh = currentModelEl.getObject3D && currentModelEl.getObject3D("mesh");
            if (!mesh) return defaults;

            const box = getModelWorldBox(mesh);
            if (box.isEmpty()) return defaults;

            const size = new THREE.Vector3();
            box.getSize(size);
            const footprint = Math.max(size.x, size.z, 6);
            const vertical = Math.max(size.y, 4);

            return {
                distance: clamp(footprint * 1.1 + 10, 18, 90),
                height: clamp(vertical * 0.5 + 8, 12, 55),
                topHeight: clamp(vertical + footprint * 0.8 + 18, 32, 160),
            };
        }

        function getBaseAnglesForMode(mode) {
            const configs = {
                side1: { yaw: THREE.MathUtils.degToRad(0), pitch: THREE.MathUtils.degToRad(-28) },
                side2: { yaw: THREE.MathUtils.degToRad(45), pitch: THREE.MathUtils.degToRad(-28) },
                side3: { yaw: THREE.MathUtils.degToRad(135), pitch: THREE.MathUtils.degToRad(-28) },
                side4: { yaw: THREE.MathUtils.degToRad(-135), pitch: THREE.MathUtils.degToRad(-28) },
                top: { yaw: THREE.MathUtils.degToRad(0), pitch: THREE.MathUtils.degToRad(-85) },
            };
            return configs[mode] || configs.side1;
        }

        function clampCameraPosition(pos) {
            pos.x = clamp(pos.x, BOUNDS.minX, BOUNDS.maxX);
            pos.z = clamp(pos.z, BOUNDS.minZ, BOUNDS.maxZ);
            pos.y = Math.max(pos.y, 2.2);
            return pos;
        }

        function isPresentationModeActive() {
            return ["side1", "side2", "side3", "side4", "top"].includes(currentCameraMode);
        }

        function resetLookControlsOrientation() {
            if (!cameraEl || !cameraEl.components) return;
            const lookControls = cameraEl.components["look-controls"];
            if (!lookControls) return;

            if (lookControls.pitchObject && lookControls.pitchObject.rotation) {
                lookControls.pitchObject.rotation.x = 0;
            }
            if (lookControls.yawObject && lookControls.yawObject.rotation) {
                lookControls.yawObject.rotation.y = 0;
            }
        }

        function focusCameraAndRestoreMouseLook() {
            if (!isPresentationModeActive()) return;
            if (currentNavMode === "walk") {
                applyCameraModePosition(currentCameraMode, true);
                return;
            }
            setLookControlsEnabled(false);
            resetLookControlsOrientation();
            applyCameraModePosition(currentCameraMode, true);
            window.requestAnimationFrame(() => {
                applyCameraModePosition(currentCameraMode, true);
                window.setTimeout(() => {
                    setLookControlsEnabled(true);
                }, 80);
            });
        }

        function updateNavModeUI() {
            navModeButtons.forEach((btn) => {
                btn.classList.toggle("is-active", btn.dataset.navMode === currentNavMode);
            });
        }

        function setNavMode(mode) {
            currentNavMode = mode === "walk" ? "walk" : "orbit";
            setPresentationControls();
            updateNavModeUI();
            if (currentNavMode === "orbit") {
                applyPresentationCamera(true);
            }
        }

        function applyPresentationCamera(forceReset) {
            if (!rig) return;

            if (forceReset) {
                presentationOrbitState.orbitDistanceScale = 1;
            }

            const target = getLookTarget();
            const framing = getFramingFromModel();
            const zoom = presentationOrbitState.orbitDistanceScale;
            const isTop = currentCameraMode === "top";

            if (forceReset) {
                const base = getBaseAnglesForMode(currentCameraMode);
                presentationOrbitState.baseYaw = base.yaw;
                presentationOrbitState.basePitch = base.pitch;
                presentationOrbitState.yawOffset = 0;
                presentationOrbitState.pitchOffset = 0;
            }

            const yaw = normalizeAngle(
                presentationOrbitState.baseYaw + presentationOrbitState.yawOffset
            );

            if (isTop) {
                const h = framing.topHeight * zoom;

                rig.object3D.position.set(
                    target.x + 1.2,
                    target.y + h,
                    target.z + 1.2
                );

                rig.object3D.lookAt(target.x, target.y + 1.8, target.z);
            } else {
                const d = framing.distance * zoom;
                const h = framing.height;

                rig.object3D.position.set(
                    target.x + Math.sin(yaw) * d,
                    target.y + h,
                    target.z + Math.cos(yaw) * d
                );

                rig.object3D.lookAt(target.x, target.y, target.z);
            }

            if (cameraEl) cameraEl.object3D.rotation.set(0, 0, 0);

            if (forceReset) resetLookControlsOrientation();

            lastSafe = rig.object3D.position.clone();
        }

        function applyCameraModePosition(mode, forceReset) {
            if (!mode) return;
            applyPresentationCamera(forceReset);
        }

        function updateCameraModeUI() {
            const hints = {
                top: "Pohľad zhora. Myšou otáčaj, kolieskom približuj/oddiaľuj.",
                side1: "Orbit okolo aktívneho modelu (360°). Iné modely sú skryté — prepni 1–4 na klávesnici alebo na mape. Koliesko = zoom.",
                side2: "Orbit okolo aktívneho modelu. Prepínanie budov: čísla na mape alebo klávesy 1–4 v zóne.",
                side3: "Orbit okolo aktívneho modelu. Walk = pohyb WASD okolo objektu.",
                side4: "Orbit okolo aktívneho modelu. Jedna scéna, jeden viditeľný objekt — zmena cez UI alebo klávesy.",
            };

            cameraModeButtons.forEach((btn) => {
                btn.classList.toggle("is-active", btn.dataset.cameraMode === currentCameraMode);
            });

            if (cameraModeHint) {
                cameraModeHint.textContent = hints[currentCameraMode] || "Prezentančný režim kamery.";
            }
        }

        function setCameraMode(mode) {
            currentCameraMode = mode || "side1";
            setPresentationControls();
            
            const base = getBaseAnglesForMode(currentCameraMode);
            presentationOrbitState.isDragging = false;
            presentationOrbitState.pointerId = null;
            presentationOrbitState.baseYaw = base.yaw;
            presentationOrbitState.basePitch = base.pitch;
            presentationOrbitState.yawOffset = 0;
            presentationOrbitState.pitchOffset = 0;
            applyPresentationCamera(false);
            
            updateCameraModeUI();
        }

        function bindPresentationPointerControls() {
            if (!scene || !rig) return;

            const startDrag = (event) => {
                if (!["side1", "side2", "side3", "side4", "top"].includes(currentCameraMode)) return;
                if (event.target && (event.target.closest("#aframe-ui") || event.target.closest("#zoneModelsPanel"))) return;

                presentationOrbitState.isDragging = true;
                presentationOrbitState.pointerId = event.pointerId ?? null;
                presentationOrbitState.startX = event.clientX;
                presentationOrbitState.startY = event.clientY;
            };

            const moveDrag = (event) => {
                if (!presentationOrbitState.isDragging) return;
                if (presentationOrbitState.pointerId !== null && event.pointerId !== presentationOrbitState.pointerId) return;

                const dx = event.clientX - presentationOrbitState.startX;
                const dy = event.clientY - presentationOrbitState.startY;
                presentationOrbitState.startX = event.clientX;
                presentationOrbitState.startY = event.clientY;

                const yawSpeed = currentCameraMode === "top" ? 0.0022 : 0.003;
                const pitchSpeed = currentCameraMode === "top" ? 0.0016 : 0.0022;

                presentationOrbitState.yawOffset = normalizeAngle(presentationOrbitState.yawOffset - dx * yawSpeed);
                presentationOrbitState.pitchOffset += dy * pitchSpeed;

                if (currentCameraMode === "top") {
                    presentationOrbitState.yawOffset = THREE.MathUtils.clamp(
                        presentationOrbitState.yawOffset,
                        THREE.MathUtils.degToRad(-35),
                        THREE.MathUtils.degToRad(35)
                    );
                    presentationOrbitState.pitchOffset = THREE.MathUtils.clamp(
                        presentationOrbitState.pitchOffset,
                        THREE.MathUtils.degToRad(-6),
                        THREE.MathUtils.degToRad(8)
                    );
                } else {
                    // Plný obeh okolo aktívneho objektu (iné modely sú skryté — na ne treba 1/2/3 alebo Walk).
                    presentationOrbitState.pitchOffset = THREE.MathUtils.clamp(
                        presentationOrbitState.pitchOffset,
                        THREE.MathUtils.degToRad(-42),
                        THREE.MathUtils.degToRad(42)
                    );
                }

                applyPresentationCamera(false);
            };

            const stopDrag = () => {
                presentationOrbitState.isDragging = false;
                presentationOrbitState.pointerId = null;
            };

            scene.addEventListener("pointerdown", startDrag);
            window.addEventListener("pointermove", moveDrag);
            window.addEventListener("pointerup", stopDrag);
            window.addEventListener("pointercancel", stopDrag);
            window.addEventListener("blur", stopDrag);
        }

        function bindOrbitWheelZoom() {
            if (!scene) return;
            scene.addEventListener(
                "wheel",
                function (event) {
                    if (currentNavMode !== "orbit") return;
                    if (!isPresentationModeActive()) return;
                    if (
                        event.target &&
                        event.target.closest &&
                        (event.target.closest("#aframe-ui") || event.target.closest("#zoneModelsPanel"))
                    ) {
                        return;
                    }
                    event.preventDefault();
                    const delta = event.deltaY > 0 ? 0.07 : -0.07;
                    presentationOrbitState.orbitDistanceScale = clamp(
                        presentationOrbitState.orbitDistanceScale + delta,
                        0.38,
                        2.4
                    );
                    applyPresentationCamera(false);
                },
                { passive: false }
            );
        }

        function ensureBuildingEntity(cfg, index, total) {
            const buildingId = cfg.id || cfg.key;
            if (!buildingId || modelRegistry.has(buildingId) || !buildingsRoot) return modelRegistry.get(buildingId) || null;

            const slot = getSceneSlot(index, total);
            const modelUrl = getModelUrl(cfg);
            if (!modelUrl) return null;

            const containerEl = document.createElement("a-entity");
            containerEl.classList.add("building-obstacle");
            containerEl.dataset.id = buildingId;
            containerEl.setAttribute("data-id", buildingId);
            containerEl.setAttribute("position", `${slot.x} 0 ${slot.z}`);
            containerEl.setAttribute("rotation", `0 ${slot.yawDeg} 0`);
            containerEl.setAttribute("visible", false);

            const animatedEl = document.createElement("a-entity");
            animatedEl.setAttribute("data-id", buildingId);
            const modelEl = document.createElement("a-entity");
            modelEl.setAttribute("data-id", buildingId);
            const modelOffset = cfg.modelOffset || cfg.modelTransform || {};
            modelEl.setAttribute("gltf-model", modelUrl);
            if (modelOffset.position) modelEl.setAttribute("position", modelOffset.position);
            if (modelOffset.rotation) modelEl.setAttribute("rotation", modelOffset.rotation);
            animatedEl.setAttribute("scale", modelOffset.scale || "1 1 1");

            modelEl.addEventListener("model-loaded", function () {
                setMeshesShadow(modelEl);
                normalizeModelPivot(modelEl, typeof cfg.groundOffsetY === "number" ? cfg.groundOffsetY : 0, {
                    centerModelXZ: !!cfg.centerModelXZ,
                });
                const mesh = modelEl.getObject3D("mesh");
                if (mesh) {
                    const box = getModelWorldBox(mesh);
                    if (!box.isEmpty()) {
                        box.getCenter(tmpVecA);
                        box.getSize(tmpVecB);
                        const radius = Math.max(tmpVecB.x, tmpVecB.z) * 0.5 + MODEL_COLLIDER_PADDING;
                        modelBoundsById.set(buildingId, { center: tmpVecA.clone(), radius: Math.max(radius, 4) });
                    }
                }
                if (pendingActivationId === buildingId) {
                    activateBuilding(cfg);
                    pendingActivationId = null;
                }
            });

            animatedEl.appendChild(modelEl);
            containerEl.appendChild(animatedEl);
            buildingsRoot.appendChild(containerEl);

            const entry = { cfg, containerEl, modelEl, slot };
            modelRegistry.set(buildingId, entry);
            modelOrder.push(buildingId);
            return entry;
        }

        function preloadAllBuildings() {
            const all = getBuildingCollection();
            all.forEach((cfg, idx) => ensureBuildingEntity(cfg, idx, all.length));
        }

        function activateBuilding(cfg) {
            const buildingId = cfg && (cfg.id || cfg.key);
            if (!buildingId) return;
            const entry = modelRegistry.get(buildingId);
            if (!entry) return;

            clearCurrentBuilding();
            modelRegistry.forEach((item, id) => {
                item.containerEl.setAttribute("visible", id === buildingId);
            });

            currentContainerEl = entry.containerEl;
            currentModelEl = entry.modelEl;
            currentBuildingCfg = cfg;
            currentBuildingId = buildingId;
            currentZoneId = cfg.zone || currentZoneId || "";

            placePresentationAnchor({ x: entry.slot.x, y: 0, z: entry.slot.z });
            updatePresentationVisuals();
            focusCameraAndRestoreMouseLook();
            rememberSelectedBuilding(currentZoneId, currentBuildingId);
            updateSidebar(cfg);
            renderZoneModels(currentZoneId, currentBuildingId);
            updateCameraModeUI();
            updateFavButtonState();
            setDebug("Aktívny model: " + buildingId);
        }

        function loadBuilding(buildingId, explicitZone) {
            const params = getParams();
            const effectiveZone = explicitZone || currentZoneId || params.zone;
            const cfg =
                getBuildingById(effectiveZone, buildingId) ||
                getBuildingCollection().find((item) => (item.id || item.key) === buildingId) ||
                null;

            if (!cfg) {
                console.warn("Unknown building id:", buildingId);
                updateSidebar(null);
                renderZoneModels(effectiveZone, "");
                setDebug("Neznámy objekt: " + buildingId);
                return;
            }
            const all = getBuildingCollection();
            const idx = all.findIndex((item) => (item.id || item.key) === (cfg.id || cfg.key));
            ensureBuildingEntity(cfg, Math.max(idx, 0), Math.max(all.length, 1));
            if (!modelRegistry.has(cfg.id || cfg.key)) {
                pendingActivationId = cfg.id || cfg.key;
                return;
            }
            activateBuilding(cfg);
        }

        cameraModeButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                setCameraMode(btn.dataset.cameraMode || "side1");
            });
        });

        navModeButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                setNavMode(btn.dataset.navMode || "orbit");
            });
        });

        window.addEventListener("keydown", (event) => {
            if (!event.key || event.repeat) return;
            if (event.target && event.target.closest && event.target.closest("input, textarea, [contenteditable='true']")) return;
            const n = Number(event.key);
            if (!Number.isInteger(n) || n < 1) return;
            const zoneBuildings = getBuildingsByZone(currentZoneId);
            const picked = zoneBuildings[n - 1];
            if (!picked) return;
            loadBuilding(picked.id || picked.key, currentZoneId);
        });

        if (rotateBtn) {
            rotateBtn.addEventListener("click", () => {
                autoRotateEnabled = !autoRotateEnabled;
                rotateBtn.textContent = autoRotateEnabled ? "⟳ Rotate ON" : "⟳ Rotate OFF";
            });
        }

        if (favBtn) {
            favBtn.addEventListener("click", addCurrentToFavorites);
            updateFavButtonState();
        }

        if (cameraEl) {
            cameraEl.removeAttribute("cursor");
            cameraEl.removeAttribute("raycaster");
        }

        AFRAME.registerComponent("scene-runtime", {
            tick: function (_, delta) {
                if (!rig) return;

                const store = window.appStore;
                const teleporting = store && store.getState ? store.getState().isTeleporting : false;
                const pos = rig.object3D.position;

                pos.y = Math.max(pos.y, 2.2);
                if (!isPresentationModeActive()) clampCameraPosition(pos);

                // Keep camera inside the dome boundary.
                const distFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
                if (distFromCenter > DOME_RADIUS) {
                    const scale = DOME_RADIUS / Math.max(distFromCenter, 0.0001);
                    pos.x *= scale;
                    pos.z *= scale;
                }

                if (currentNavMode === "walk" && currentBuildingId && modelBoundsById.has(currentBuildingId)) {
                    const b = modelBoundsById.get(currentBuildingId);
                    const d = distance3D(pos, b.center);
                    if (d < b.radius) {
                        const dirX = pos.x - b.center.x;
                        const dirZ = pos.z - b.center.z;
                        const len = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
                        pos.x = b.center.x + (dirX / len) * b.radius;
                        pos.z = b.center.z + (dirZ / len) * b.radius;
                    }
                }

                if (!teleporting) {
                    if (!lastSafe) lastSafe = pos.clone();
                    else lastSafe.copy(pos);
                }

                if (autoRotateEnabled && currentContainerEl) {
                    currentContainerEl.object3D.rotation.y += delta * 0.001;
                }

                // Ray intersection: detect object in front of camera.
                if (cameraEl && cameraEl.object3D && currentContainerEl) {
                    cameraEl.object3D.getWorldPosition(tmpVecA);
                    cameraEl.object3D.getWorldDirection(tmpVecB);
                    raycaster.set(tmpVecA, tmpVecB);
                    const mesh = currentModelEl && currentModelEl.getObject3D ? currentModelEl.getObject3D("mesh") : null;
                    if (mesh) {
                        const hits = raycaster.intersectObject(mesh, true);
                        if (hits.length > 0 && hits[0].distance < 120) {
                            scene.dataset.objectAhead = currentBuildingId || "";
                        } else {
                            scene.dataset.objectAhead = "";
                        }
                    }
                }

                // Distance-based nearest model lookup (for BC requirement).
                let nearestId = "";
                let nearestDistance = Infinity;
                modelBoundsById.forEach((b, id) => {
                    const d = distance3D(pos, b.center);
                    if (d < nearestDistance) {
                        nearestDistance = d;
                        nearestId = id;
                    }
                });
                scene.dataset.nearestObject = nearestId;
            },
        });

        if (!scene.hasAttribute("scene-runtime")) {
            scene.setAttribute("scene-runtime", "");
        }

        bindPresentationPointerControls();
        bindOrbitWheelZoom();

        window.loadBuilding = loadBuilding;
        updateCameraModeUI();
        setPresentationControls();
        updateNavModeUI();
        preloadAllBuildings();

        const params = getParams();
        const initialBuilding = getBuildingById(params.zone, params.id) || getDefaultBuilding();

        if (initialBuilding) {
            loadBuilding(initialBuilding.id || initialBuilding.key, initialBuilding.zone || params.zone);
            setDebug("Spúšťam: " + (initialBuilding.id || "") + " · zóna " + (params.zone || ""));
        } else {
            updateSidebar(null);
            setDebug("Žiadna budova v konfigurácii.");
            console.warn("No building found for initial load.");
        }
    }

    try {
        initSceneRuntime();
    } catch (err) {
        setDebug("Init failed: " + (err && err.message ? err.message : String(err)));
        console.error(err);
    }

    if (scene) {
        scene.addEventListener("loaded", function () {
            if (debugEl) debugEl.textContent = (debugEl.textContent || "") + " · A-Frame OK";
        });
    }
})();