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
 * Selektiert den Logout Button und führt bei dem Klick-Event<br>
 * POST /logout aus
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
                console.log(res.status + " " + data.message);
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
 * Behandelt das Klick-Ereignis auf ein Galerie-Element, d.h
 * 1. Es extrahiert die Fotodaten aus dem angeklickten Bild {@link extractPhotoData}
 * 2. Aktualisiert die ModalUI {@link updateModalUI}
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
 * Aktualisiert das Modal mit den extrahierten Fotodaten<br>
 * {@link updateModalTags}<br>
 * {@link resetModalInputs}
 *
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
 * Aktualisiert die Modal-Tags-UI.<br>
 * Fügt den Delete Buttons für die Tags ein Event Listener hinzu, und bei ausgelöstem Klick-Event {@link handleTagDelete} aufruft
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
 * Fügt einen Event-Listener zum Hinzufügen eines Tags hinzu<br>
 * und ruft {@link handleTagAdd} mit der entsprechenden extrahierten photoID und dem tagNamen auf.
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
 *
 * Aktualisiert das Tag Attribute des entsprechenden Fotos und aktualisiert die Modaloberfläche {@link updateModalUI} mit den
 * aktualisierten extrahierten Fotodaten {@link extractPhotoData}  <br>
 *
 * POST /tag <br>
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
        try {
            const reqData = {
                photoID: photoID,
                tag: tagName
            };
            const res = yield fetch("http://localhost:8080/photos/tag", {
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
                renderError(document.querySelector("#error-edit-photo-container"), false, data.message);
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
function renderError(errorContainer, resetErrorMessage, message) {
    // const errorContainer = document.querySelector("#error-edit-photo-container") as HTMLDivElement;
    const errorParagraph = errorContainer.querySelector("p");
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
 * @param tag Der tag der gelöscht werden soll
 * @param colDiv HTMLDivElement
 */
function handleTagDelete(tag, colDiv) {
    return __awaiter(this, void 0, void 0, function* () {
        const img = document.querySelector("#modal-img");
        const imgId = img.dataset.id;
        const reqData = {
            photoID: imgId,
            tag: tag
        };
        try {
            const res = yield fetch("http://localhost:8080/photos/tag", {
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
                const res = yield fetch("http://localhost:8080/photos/photoTitle", {
                    method: "PATCH",
                    credentials: "include",
                    body: JSON.stringify(reqData)
                });
                const data = yield res.json();
                if (res.status == 200) {
                    const img = document.querySelector(`img[data-id='${photoID}']`);
                    img.setAttribute("title", data.photoTitle);
                    renderError(document.querySelector("#error-edit-photo-container"), true);
                    updateModalUI(extractPhotoData(img));
                }
                else {
                    renderError(document.querySelector("#error-edit-photo-container"), false, data.message);
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
            renderUsername(data.username);
        }
        catch (error) {
            console.error("Error GET /username", error);
        }
    });
}
/**
 * GET /role <br>
 * {@link renderGoToAdminPage}
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
/**
 * Leitet den Nutzer zur Adminseite weiter, wenn dieser auf den entsprechenden Button klickt und als Admin angemeldet ist
 */
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
 * Extrahiert den Suchparameter aus dem entsprechenden Input-Feld, wenn das Submit-Event des entsprechenden Forms ausgelöst wurde<br>
 * Ruft mit dem extrahierten Suchparameter {@link fetchPhotos} auf
 */
function addSearchPhotosListener() {
    document.querySelector("#searchPhotos").addEventListener("submit", (evt) => __awaiter(this, void 0, void 0, function* () {
        evt.preventDefault();
        const query = document.querySelector("#searchPhotosQuery").value;
        yield fetchPhotos(query);
    }));
}
addSearchPhotosListener();
/**
 * GET /photos <br>
 * Funktion zum Abrufen aller Fotos eines Benutzers vom Server, optional mit übergebenem Suchparameter
 */
function fetchPhotos(searchVal) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("/photos?" + (searchVal ? new URLSearchParams({ photoTitle: searchVal, tag: searchVal }).toString() : ""), {
                method: "GET",
                credentials: "include"
            });
            if (!res.ok) {
                console.error("Error fetching photos");
            }
            const data = yield res.json();
            clearImages(document.querySelector("#main-photos-container .row"));
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
        yield fetchAlbums();
        yield fetchRole();
    }));
}
initializePage();
/**
 * Entfernt die Bilder aus dem DOM
 * @param element Das entsprechende Element
 */
function clearImages(element) {
    if (!element) {
        console.error("Container not found");
        return;
    }
    element.innerHTML = "";
}
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
 * Extrahiert die photoID aus dem entsprechendem HTML Element und ruft
 *
 * PATCH /photos/photoDate
 * {
 *     "photoID" : ___,
 *     "date" : ___
 * } <br>
 *
 * mit dem übergebenen Datum auf <br>
 *
 * Aktualisiert die ModalUI {@link updateModalUI} mit den aktualisierten extrahierten Fotodaten {@link updateModalUI}<br>
 * Rendert error messages oder setzt diese zurück {@link renderError}
 */
function handleEditPhotoDate(date) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const photoID = document.querySelector("#modal-img").dataset.id;
            const reqData = {
                photoID: photoID,
                date: date
            };
            const res = yield fetch("http://localhost:8080/photos/photoDate", {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify(reqData)
            });
            const data = yield res.json();
            if (res.status == 200) {
                const imgElement = document.querySelector(`img[data-id='${photoID}']`);
                imgElement.dataset.date = data.newDate;
                updateModalUI(extractPhotoData(imgElement));
                renderError(document.querySelector("#error-edit-photo-container"), true);
            }
            else {
                renderError(document.querySelector("#error-edit-photo-container"), false, data.message);
            }
        }
        catch (error) {
            console.error("Error PATCH /photoDate");
        }
    });
}
/**
 * Wartet, bis der entsprechende Button ein click-event auslöst und ruft dann {@link handleEditPhotoDate} mit dem extrahiertem Fotodatum auf.<br>
 */
function editDateListener() {
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelector("#submit-edit-date").addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
            yield handleEditPhotoDate(document.querySelector("#edit-date").value);
        }));
    });
}
editDateListener();
/**
 * Wartet, bis der entsprechende Button zum Löschen eines Fotos ein click-event auslöst und ruft mit der extrahierten photoID {@link handlePhotoDelete} auf
 */
function editDelPhotoBtnListener() {
    document.querySelector("#del-photo-btn").addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
        yield handlePhotoDelete(document.querySelector("#modal-img").dataset.id);
    }));
}
editDelPhotoBtnListener();
/**
 * DELETE /img/:photoID
 * @param photoID Die ID des Fotos
 */
function handlePhotoDelete(photoID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch(`http://localhost:8080/img/${photoID}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (res.status == 204) {
                renderError(document.querySelector("#error-edit-photo-container"), true);
                yield fetchPhotos();
                window.location.reload();
            }
            else {
                const data = yield res.json();
                console.log(data.message);
                renderError(document.querySelector("#error-edit-photo-container"), false, data.message);
            }
        }
        catch (err) {
            console.log(err);
        }
    });
}
//Don't allow Dates that are in the future for Image Date of creation
const addPhotoDate = document.getElementById("addPhotoDate");
let today = new Date().toISOString().split("T")[0];
addPhotoDate.setAttribute("max", today);
function addPhoto() {
    const addPhotoSubmit = document.getElementById("addPhotoSubmit");
    addPhotoSubmit.addEventListener("click", (evt) => __awaiter(this, void 0, void 0, function* () {
        const photoName = document.getElementById("addPhotoName").value;
        const photoDate = document.getElementById("addPhotoDate").value;
        const photoData = document.getElementById("photoUploadBtn").files;
        const formData = new FormData();
        formData.append("title", photoName);
        formData.append("taken", photoDate);
        formData.append("photo", photoData[0]);
        try {
            const res = yield fetch("http://localhost:8080/photos", {
                method: "POST",
                credentials: "include",
                headers: {},
                body: formData
            });
            const data = yield res.json();
            if (res.status == 201) {
                window.location.reload();
                renderError(document.querySelector("#error-add-photo-container"), true);
            }
            else {
                renderError(document.querySelector("#error-add-photo-container"), false, data.message);
            }
        }
        catch (error) {
            console.log("ERROR at POST /photos");
        }
    }));
}
addPhoto();
/**
 * POST /albums
 * Sendet Daten zur Erstellung eines Albums an den Server
 * Lädt die Seite neu wenn Album erfolgreich erstellt wurde
 */
function addAlbum() {
    const addAlbumSubmit = document.getElementById("addAlbumSubmit");
    addAlbumSubmit.addEventListener("click", (evt) => __awaiter(this, void 0, void 0, function* () {
        const albumName = document.getElementById("addAlbumName").value;
        const reqData = {
            title: albumName
        };
        try {
            const res = yield fetch("http://localhost:8080/albums", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reqData),
            });
            if (res.status == 201) {
                window.location.reload();
            }
        }
        catch (error) {
            console.log("ERROR at POST /Albums");
        }
    }));
}
addAlbum();
/**
 * Wartet auf das Submit Event des entsprechenden Formulars und extrahiere den Wert des Input-Feldes <br>
 * Gebe den Wert des Input-Feldes als Suchparameter an die entsprechende Funktion, die die http-Anfrage tätigt {@link fetchAlbums}
 */
function searchAlbums() {
    document.querySelector("#searchAlbums").addEventListener("submit", (evt) => __awaiter(this, void 0, void 0, function* () {
        evt.preventDefault();
        const query = document.querySelector("#searchAlbumsQuery").value;
        yield fetchAlbums(query);
    }));
}
searchAlbums();
/**
 * GET /albums <br>
 * Optional mit Suchparameter <br>
 */
function fetchAlbums(searchParam) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("http://localhost:8080/albums?" + (searchParam ? new URLSearchParams({ searchParam: searchParam }).toString() : ""), {
                method: "GET",
                credentials: "include"
            });
            if (res.ok) {
                const data = yield res.json();
                renderAlbums(data.albums);
            }
            else {
                const data = yield res.json();
                console.log(res.status + " " + data.message);
            }
        }
        catch (error) {
            console.error(error);
        }
    });
}
/**
 * Render die Alben mit folgenden Besonderheiten.
 * 1. Setze den Container zurück
 * 2. Iteriere durch die Alben und füge disee hinzu.
 * 3. Speichere die Album_ID und die tags als kommaseparierter String als data-attribute im entsprechenden html Element
 * 4. Füge jedem edit button die Klasse .edit-btns hinzu
 * 5. Füge jedem delete button die Klasse .del-btns hinzu.
 * 6. Rufe {@link renderAlbumsEditModal} und {@link attachDelAlbumListener } auf
 * @param albums Ein Array vom Typ Album {@link Album}
 */
function renderAlbums(albums) {
    const displayAlbumsContainer = document.querySelector("#display-albums");
    // reset container
    displayAlbumsContainer.innerHTML = `
      <li class="list-group-item d-flex align-items-center">
        <button class="btn w-100 d-flex justify-content-start">Alle Fotos</button>
      </li>
  `;
    albums.forEach(album => {
        const { id, title, tags } = album; // DESTRUCTURING
        const albumChild = document.createElement("li");
        albumChild.setAttribute("data-album-id", id.toString()); // Insert album id in parent container
        if (typeof tags == "string") { // Wenn das Album Tags besitzt
            albumChild.setAttribute("data-tags", tags); // Füge tags als kommaseparierter String in das parent Element ein
        }
        albumChild.className = "list-group-item d-flex align-items-center";
        albumChild.innerHTML = `
      <button class="btn w-75 d-flex justify-content-start album-title">${title}</button> <!-- Albumtitel hier einfügen -->
      <span>
          <!-- Edit Button - OPENS EDIT MODAL ALBUM -->
          <button class="btn btn-sm btn-outline-secondary edit-btns" data-bs-toggle="modal" data-bs-target="#editAlbumModal"> <!-- KONVENTION: Jeder Edit Button bekommt die Klasse edit-btns -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
              <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
              <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
            </svg>
          </button>
          <!-- Delete Button - Deletes album -->
          <button class="btn btn-sm btn-outline-danger del-btns"> <!-- KONVENTION: Jeder Delete Button bekommt die Klasse del-btns -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
            </svg>
          </button>
      </span>
    `;
        displayAlbumsContainer.appendChild(albumChild);
    });
    renderAlbumsEditModal();
    attachDelAlbumListener();
}
/**
 * Selektiere alle Buttons mit der js-target Klasse .del-btns und füge jedem Button ein Event-Listener hinzu (click).<br>
 * Selektiere beim Klick, die ID des Albums, welche als data-attribute im übergeordneten Element gespeichert ist<br>
 * Rufe mit der selektierten Album ID die Funktion auf, die die http-Anfrage an den Server stellt, ein Album zu löschen {@link handleAlbumDelete }
 *
 */
function attachDelAlbumListener() {
    document.querySelectorAll(".del-btns").forEach(delBtn => {
        delBtn.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
            const closetLi = delBtn.closest("li");
            const albumID = closetLi.getAttribute("data-album-id");
            yield handleAlbumDelete(albumID);
        }));
    });
}
/**
 * DELETE /albums/:albumID
 *
 * Ruft bei Erfolg (Statuscode 204) {@link fetchAlbums} auf.
 * Gibt bei Misserfolg den Statuscode und die Fehlermeldung in der Konsole aus
 *
 * @param albumID Die ID des Albums, die als Pfadparameter dem http-Req übergeben wird.
 */
function handleAlbumDelete(albumID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("http://localhost:8080/albums/" + albumID, {
                method: "DELETE",
                credentials: "include"
            });
            if (res.status == 204) {
                yield fetchAlbums();
            }
            else {
                const data = yield res.json();
                console.log(res.status + " " + data.message);
            }
        }
        catch (err) {
            console.log(err);
        }
    });
}
/**
 * Fügt ein click Event Listener dem entsprechenden Button hinzu und extrahiert den neuen Titel des Albums aus dem Input-Feld sowie die albumID des Albums aus dem
 * Modalcontainer (data attribut).
 * Ruft mit dem neuen Titel und der albumID {@link handlerPatchAlbumsTitle} auf.
 */
function patchAlbumsTitle() {
    const submitEditAlbumNameBtn = document.querySelector("#submit-edit-album-name");
    const editAlbumNameInput = document.querySelector("#edit-album-name");
    submitEditAlbumNameBtn.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
        const title = editAlbumNameInput.value;
        const albumID = document.querySelector("#editAlbumModal").getAttribute("data-album-id");
        yield handlerPatchAlbumsTitle(title, parseInt(albumID));
    }));
}
patchAlbumsTitle();
/**
 * PATCH /albums/albumsTitle mit den Parametern als JSON body
 *
 * @param title Der neue Titel des Albums
 * @param albumID Die albumID des Albums
 */
function handlerPatchAlbumsTitle(title, albumID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("http://localhost:8080/albums/albumsTitle", {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify({ title: title, albumID: albumID })
            });
            if (res.ok) {
                const data = yield res.json();
                console.log(`
      ${res.status}
      ${data.message}
      ${data.albumTitle}
      `);
                document.querySelector("#album-title").textContent = data.albumTitle; // Aktualisiere das Modal, sodass man nicht das Modal erst schließe und wieder öffnen kann
                yield fetchAlbums();
            }
            else {
                const data = yield res.json();
                console.log(res.status + " " + data.message);
            }
        }
        catch (err) {
            console.log(err);
        }
    });
}
/**
 * Überträgt die Daten des entsprechenden Albums an das Modal, d.h Titel, ID, Tags als kommaseparierter String (wenn vorhanden) an das Modal<br>
 * Setzt die Input-Felder des Modals zurück.<br>
 */
function renderAlbumsEditModal() {
    // attach event listener to edit btns in albums list
    const editBtns = document.querySelectorAll(".edit-btns");
    editBtns.forEach(editBtn => {
        editBtn.addEventListener("click", () => {
            // pick attributes from album
            const closestLiElement = editBtn.closest("li");
            const data_album_id = closestLiElement.getAttribute("data-album-id");
            const title = closestLiElement.querySelector(".album-title").textContent;
            const data_tags = closestLiElement.hasAttribute("data-tags") ? closestLiElement.getAttribute("data-tags") : undefined;
            // reset an update input fields, album title and tags
            const editAlbumModalContainer = document.querySelector("#editAlbumModal");
            editAlbumModalContainer.setAttribute("data-album-id", data_album_id);
            const editAlbumNameInput = document.querySelector("#edit-album-name");
            editAlbumNameInput.value = "";
            const addTagToAlbumInput = document.querySelector("#addTagToAlbumInput");
            addTagToAlbumInput.value = "";
            document.querySelector("#album-title").textContent = title;
            const tagsContainer = document.querySelector("#album-tags .row");
            tagsContainer.innerHTML = "";
            data_tags === null || data_tags === void 0 ? void 0 : data_tags.split(", ").forEach(tag => {
                const tagContainer = document.createElement("div");
                tagContainer.className = "col";
                tagContainer.innerHTML = `
        <p class="badge bg-light text-dark">
            ${tag}
            <button class="btn btn-close" aria-label="Tag entfernen">
            </button>
        </p>
      `;
                tagsContainer.append(tagContainer);
            });
        });
    });
}
// --- ALBEN ---
