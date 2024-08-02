"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * POST /logout
 */
function logout() {
    const logoutBtn = document.querySelector("#logout-btn");
    logoutBtn.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("http://localhost:8080/logout", {
                method: "POST",
                redirect: "follow",
                credentials: "include"
            });
            if (res.redirected) {
                window.location.href = res.url; // https://stackoverflow.com/questions/39735496/redirect-after-a-fetch-post-call
            }
            else {
                const data = yield res.json();
                console.log(data.message);
            }
        }
        catch (error) {
            console.error("Error POST /logout", error);
        }
    }));
}
logout();
/**
 * Fügt einen Klick-Event-Listener zu Galerie-Elementen hinzu.
 */
function attachGalleryItemClickListener() {
    document.addEventListener('click', handleGalleryItemClick);
}
attachGalleryItemClickListener();
/**
 * Behandelt das Klick-Ereignis auf ein Galerie-Element.
 * @param e MouseEvent
 */
function handleGalleryItemClick(e) {
    const target = e.target;
    if (target.classList.contains('gallery-item')) { // KONVENTION: Alle Bilder besitzen die Klasse '.gallery-item'
        const photoData = extractPhotoData(target);
        updateModalUI(photoData);
    }
}
/**
 * Extrahiert die Fotodatenattribute vom angeklickten Galerie-Element.
 * @param target HTMLElement
 * @returns Ein Objekt, das die Fotodaten enthält.
 */
function extractPhotoData(target) {
    const title = target.getAttribute('title');
    const id = target.getAttribute('data-id');
    const imgUrl = target.getAttribute('src');
    const taken = target.getAttribute('data-date');
    const tags = target.getAttribute('data-tags');
    return { id, title, taken, imgUrl, tags };
}
/**
 * Aktualisiert das Modal mit den extrahierten Fotodaten
 * @param photoData Ein Photo Objekt, welches die Fotodaten beinhaltet
 */
function updateModalUI(photoData) {
    const { id, title, taken, imgUrl, tags } = photoData; // DESTRUCTURING
    // Aktualisiere die Modal Elemente
    const imageTitle = document.querySelector("#image-title");
    const modalImg = document.querySelector("#modal-img");
    const modalTaken = document.querySelector("#taken");
    const modalTags = document.querySelector("#tags .row");
    imageTitle.textContent = title;
    modalImg.setAttribute("data-id", id);
    modalImg.setAttribute("title", title);
    modalImg.setAttribute("src", imgUrl);
    modalImg.setAttribute("data-taken", taken);
    modalTaken.textContent = `Aufnahmedatum: ${taken}`;
    modalImg.setAttribute("data-tags", tags || "");
    // Aktualisiere die Tags
    updateModalTags(modalTags, tags || "");
    // Setze die Eingabefelder zurück
    resetModalInputs();
}
/**
 * Aktualisiert die Modal-Tags-UI.
 * @param modalTags HTMLElement
 * @param tags string
 */
function updateModalTags(modalTags, tags) {
    modalTags.innerHTML = "";
    if (tags.length > 0) {
        tags.split(", ").forEach(tag => {
            const colDiv = document.createElement("div");
            colDiv.classList.add("col");
            const tagElement = document.createElement("p");
            tagElement.classList.add("badge", "bg-light", "text-dark");
            tagElement.textContent = tag;
            const delBtn = document.createElement("button");
            delBtn.classList.add("btn", "btn-close");
            delBtn.setAttribute("aria-label", "Tag entfernen");
            delBtn.setAttribute("id", "deleteTag");
            delBtn.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () { return yield handleTagDelete(delBtn, tag, colDiv); }));
            tagElement.appendChild(delBtn);
            colDiv.appendChild(tagElement);
            modalTags.appendChild(colDiv);
        });
    }
}
/**
 * Setzt die Eingabefelder im Modal zurück.
 */
function resetModalInputs() {
    document.querySelector("#edit-name").value = "";
    document.querySelector("#edit-date").value = "";
    document.querySelector("#addTagInput").value = "";
}
/**
 * Fügt einen Event-Listener zum Hinzufügen eines Tags hinzu
 */
function attachAddTagListener() {
    document.addEventListener("DOMContentLoaded", () => {
        const submitAddTagInput = document.querySelector("#submitAddTagInput");
        submitAddTagInput.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
            const tagName = document.querySelector("#addTagInput").value;
            const photoID = Number(document.querySelector("#modal-img").getAttribute("data-id"));
            yield handleTagAdd(photoID, tagName);
        }));
    });
}
attachAddTagListener();
/**
 * POST /tag
 * {
 *     photoID: ___,
 *     tag: ___
 * }
 *
 * @param photoID Die id des Fotos (unique, weil primary key)
 * @param tagName Der Tag, der hinzugefügt werden soll
 */
function handleTagAdd(photoID, tagName) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log("called2");
        const reqData = {
            photoID: photoID,
            tag: tagName
        };
        try {
            const res = yield fetch("http://localhost:8080/tag", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reqData)
            });
            if (res.status == 201) {
                const data = yield res.json();
                console.log(data.message);
                document.querySelector("#error-edit-photo-container").classList.add("d-none");
                const img = document.querySelector(`img[data-id='${photoID}']`);
                let tags = img.dataset.tags;
                if (tags.length == 0) {
                    tags = tagName;
                }
                else {
                    tags = tags + `, ${tagName}`;
                }
                img.dataset.tags = tags;
                updateModalUI(extractPhotoData(img));
            }
            else {
                const data = yield res.json();
                renderErrorEditPhoto(false, data.message);
            }
        }
        catch (error) {
            console.error("Error POST /tag", error);
        }
    });
}
/**
 * Rendert die Fehlermeldungen, die auftreten können, wenn man ein Foto bearbeitet.
 * @param resetErrorMessage true, wenn die Fehlermeldung zurückgesetzt werden soll und der container versteckt werden soll; false sonst
 * @param message Die Fehlermeldung, die gerendert werden soll
 */
function renderErrorEditPhoto(resetErrorMessage, message) {
    const errorContainer = document.querySelector("#error-edit-photo-container");
    const errorParagraph = document.querySelector("#error-edit-photo");
    if (resetErrorMessage) {
        // Wenn resetErrorMessage true ist, leeren wir die Fehlermeldung und verstecken den Container
        if (errorParagraph) {
            errorParagraph.textContent = '';
        }
        if (errorContainer) {
            errorContainer.classList.add("d-none");
        }
    }
    else {
        // Wenn message definiert ist und nicht leer ist, zeigen wir die Fehlermeldung an
        if (message && message.trim() != '') {
            if (errorParagraph) {
                errorParagraph.textContent = message;
            }
            if (errorContainer) {
                errorContainer.classList.remove("d-none");
            }
        }
        else {
            // Wenn keine Nachricht vorhanden ist oder leer ist, verstecken wir den Container
            if (errorContainer) {
                errorContainer.classList.add("d-none");
            }
        }
    }
}
/**
 * Behandelt das Löschen eines Tags.
 * DELETE /tag
 * {
 *     "photoID" : ___,
 *     "tag" : ___
 * }
 * @param delBtn HTMLButtonElement
 * @param tag string
 * @param colDiv HTMLDivElement
 */
function handleTagDelete(delBtn, tag, colDiv) {
    return __awaiter(this, void 0, void 0, function* () {
        const img = document.querySelector("#modal-img");
        const imgId = img.dataset.id;
        const reqData = {
            photoID: imgId,
            tag: tag
        };
        try {
            const res = yield fetch("http://localhost:8080/tag", {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reqData)
            });
            if (res.status == 204) {
                // Remove Element from DOM
                colDiv.remove();
                // Aktualisiere die Tags des Bildes
                const imgElement = document.querySelector(`img[data-id='${imgId}']`);
                if (imgElement) {
                    const currentTags = imgElement.getAttribute("data-tags");
                    if (currentTags) {
                        const updatedTags = currentTags.split(", ").filter(t => t != tag).join(", ");
                        imgElement.setAttribute("data-tags", updatedTags);
                    }
                }
            }
            else {
                console.log(yield res.json());
            }
        }
        catch (error) {
            console.error("Error DELETE /tag", error);
        }
    });
}
/**
 * PATCH
 * {
 *     "photoID" : ___,
 *     "photoTitle" : ___
 * }
 */
function editPhotoTitle() {
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelector("#submit-edit-name").addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
            try {
                const photoID = Number(document.querySelector("#modal-img").getAttribute("data-id"));
                const reqData = {
                    photoID: photoID,
                    photoTitle: document.querySelector("#edit-name").value
                };
                const res = yield fetch("http://localhost:8080/photoTitle", {
                    method: "PATCH",
                    credentials: "include",
                    body: JSON.stringify(reqData)
                });
                const data = yield res.json();
                if (res.status == 200) {
                    const img = document.querySelector(`img[data-id='${photoID}']`);
                    img.setAttribute("title", data.photoTitle);
                    renderErrorEditPhoto(true);
                    updateModalUI(extractPhotoData(img));
                }
                else {
                    console.log("called");
                    renderErrorEditPhoto(false, data.message);
                }
            }
            catch (error) {
                console.log("Error updating photo's title" + error);
            }
        }));
    });
}
editPhotoTitle();
/**
 * GET /username
 */
function fetchUsername() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("/username", {
                method: "GET",
                credentials: "include"
            });
            if (!res.ok) {
                console.error("Error fetching username");
            }
            const data = yield res.json();
            console.log(data);
            renderUsername(data.username);
        }
        catch (error) {
            console.error("Error GET /username", error);
        }
    });
}
/**
 * GET /role
 */
function fetchRole() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("http://localhost:8080/role", {
                method: "GET",
                credentials: "include"
            });
            const data = yield res.json();
            renderGoToAdminPage(data.role);
        }
        catch (error) {
            console.error("Error GET /role" + error);
        }
    });
}
/**
 * Zeigt den Button "Zur Adminseite" nicht an, wenn der Nutzer kein Admin ist.
 * @param role Rolle des Benutzers
 */
function renderGoToAdminPage(role) {
    const goToAdminPageItem = document.querySelector("#go-to-admin-page");
    if (role == "ADMIN") {
        goToAdminPageItem.classList.remove("d-none");
    }
    else {
        goToAdminPageItem.classList.add("d-none");
    }
}
function redirectToAdminPage() {
    document.querySelector("#go-to-admin-page").addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("http://localhost:8080/protected/admin.html");
            window.location.href = res.url;
        }
        catch (error) {
            console.error("Error redirecting to Admin-Page");
        }
    }));
}
redirectToAdminPage();
/**
 * Funktion zum Rendern des Benutzernamens im DOM
 * @param username Der Benutzername
 */
function renderUsername(username) {
    const usernameField = document.querySelector("#username");
    usernameField.textContent = username;
}
/**
 * GET /photos <br>
 * Funktion zum Abrufen aller Fotos eines Benutzers vom Server
 */
function fetchPhotos() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("/photos", {
                method: "GET",
                credentials: "include"
            });
            if (!res.ok) {
                console.error("Error fetching photos");
            }
            const data = yield res.json();
            data.photos.forEach(photo => renderPhotos(photo));
        }
        catch (error) {
            console.error("Error GET /photos", error);
        }
    });
}
/**
 * Funktion zum Initialisieren der Seite.
 */
function initializePage() {
    document.addEventListener("DOMContentLoaded", () => __awaiter(this, void 0, void 0, function* () {
        yield fetchUsername();
        yield fetchPhotos();
        yield fetchRole();
    }));
}
initializePage();
/**
 * Fügt ein Bild in den DOM ein.
 * Dabei werden die Attribute src, title, date-date und data-tags gesetzt https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes
 * Des Weiteren werden die für Bootstrap erforderlichen Attribute dem <img> Tag hinzugefügt
 * @param photo Ein Bild
 */
function renderPhotos(photo) {
    const { id, imgUrl, title, taken, tags } = photo;
    // Hauptcontainer auswählen
    const mainContainer = document.querySelector("#main-photos-container .row");
    // Prüfen, ob das Element existiert
    if (!mainContainer) {
        console.error("Container not found");
        return;
    }
    // Erstellen des Bild Containers
    const colDiv = document.createElement("div");
    colDiv.classList.add("col-sm-6", "col-md-4", "col-lg-3");
    // Erstellen des Bildes
    const img = document.createElement("img");
    img.classList.add("img-fluid", "gallery-item");
    img.dataset.id = id;
    img.src = `http://localhost:8080/img/${imgUrl}`;
    img.title = title;
    img.dataset.date = taken;
    if (photo.tags) {
        img.dataset.tags = tags;
    }
    else {
        img.dataset.tags = "";
    }
    // Für das Bootstrap modal erforderliche Attribute setzen
    img.setAttribute("data-bs-toggle", "modal");
    img.setAttribute("data-bs-target", "#gallery-modal");
    // Bild in den Bild Container einfügen
    colDiv.appendChild(img);
    // Bild-Container in den Hauptcontainer einfügen
    mainContainer.appendChild(colDiv);
}
/**
 * PATCH /photoDate
 * {
 *     "photoID" : ___,
 *     "date" : ___
 * }
 */
function handleEditPhotoDate(date) {
    return __awaiter(this, void 0, void 0, function* () {
        const photoID = document.querySelector("#modal-img").dataset.id;
        try {
            const reqData = {
                photoID: photoID,
                date: date
            };
            const res = yield fetch("http://localhost:8080/photoDate", {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify(reqData)
            });
            const data = yield res.json();
            if (res.status == 200) {
                const imgElement = document.querySelector(`img[data-id='${photoID}']`);
                imgElement.dataset.date = data.newDate;
                updateModalUI(extractPhotoData(imgElement));
                renderErrorEditPhoto(true);
            }
            else {
                renderErrorEditPhoto(false, data.message);
            }
        }
        catch (error) {
            console.error("Error PATCH /photoDate");
        }
    });
}
function editDateListener() {
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelector("#submit-edit-date").addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
            yield handleEditPhotoDate(document.querySelector("#edit-date").value);
        }));
    });
}
editDateListener();
const addAlbumSubmit = document.getElementById("addAlbumSubmit");
addAlbumSubmit.addEventListener("click", (evt) => __awaiter(void 0, void 0, void 0, function* () {
    const albumName = document.getElementById("addAlbumName").value;
    const reqData = {
        album: {
            title: albumName
        }
    };
    const res = yield fetch("http://localhost:8080/albums", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(reqData),
    });
    // const data = await res.json(-);
}));
//Don't allow Dates that are in the future for Image Date of creation
const addPhotoDate = document.getElementById("addPhotoDate");
let today = new Date().toISOString().split("T")[0];
addPhotoDate.setAttribute("max", today);
const addPhotoSubmit = document.getElementById("addPhotoSubmit");
addPhotoSubmit.addEventListener("click", (evt) => __awaiter(void 0, void 0, void 0, function* () {
    const photoName = document.getElementById("addPhotoName").value;
    const photoDate = document.getElementById("addPhotoDate").value;
    const photoData = document.getElementById("photoUploadBtn").files;
    const formData = new FormData();
    formData.append("title", photoName);
    formData.append("taken", photoDate);
    formData.append("photo", photoData[0]);
    //TODO: um res einen try-catch Block machen falls verbindung fehlschlägt
    const res = yield fetch("http://localhost:8080/photos", {
        method: "POST",
        credentials: "include",
        headers: {},
        body: formData
    });
    const data = yield res.json();
}));
