// @ts-ignore
import {renderError} from "/helper.js";

/**
 * Besonderheit: Tags als kommaseparierter String
 */
interface Photo {
    id: string,
    title: string;
    taken: string;
    imgUrl: string;
    tags?: string; // tags als kommaseparierter String
}

/**
 * Selektiert den Logout Button und führt bei dem Klick-Event<br>
 * POST /logout aus
 */
function logout() {
    const logoutBtn = document.querySelector("#logout-btn") as HTMLButtonElement;
    logoutBtn.addEventListener("click", async () => {
        try {
            const res: Response = await fetch("http://localhost:8080/logout", {
                method: "POST",
                redirect: "follow",
                credentials: "include"
            });

            if (res.redirected) {
                window.location.href = res.url; // https://stackoverflow.com/questions/39735496/redirect-after-a-fetch-post-call
            } else {
                const data: { message: string } = await res.json();
                console.log(res.status + " " + data.message);
            }

        } catch (error) {
            console.error("Error POST /logout", error);
        }
    });
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
function handleGalleryItemClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
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
function extractPhotoData(target: HTMLElement): Photo {
    const title = target.getAttribute('title') as string;
    const id = target.getAttribute('data-id') as string;
    const imgUrl = target.getAttribute('src') as string;
    const taken = target.getAttribute('data-date') as string;
    const tags = target.getAttribute('data-tags') as string;
    return {id, title, taken, imgUrl, tags};
}

/**
 * Aktualisiert das Modal mit den extrahierten Fotodaten<br>
 * {@link updateModalTags}<br>
 * {@link resetModalInputs}
 *
 * @param photoData Ein Photo Objekt, welches die Fotodaten beinhaltet
 */
async function updateModalUI(photoData: Photo) {
    const {id, title, taken, imgUrl, tags} = photoData; // DESTRUCTURING

    // Aktualisiere die Modal Elemente
    const imageTitle = document.querySelector("#image-title") as HTMLElement;
    const modalImg = document.querySelector("#modal-img") as HTMLImageElement;
    const modalTaken = document.querySelector("#taken") as HTMLParagraphElement;
    const modalTags = document.querySelector("#tags .row") as HTMLDivElement;

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

    try {
        const data = await photoIsInAlbum(parseInt(id));

        if (Array.isArray(data)) {
            createAlbumList(data);
        }

    } catch (err) {
        console.error("Fehler bei updateModalUI:", err);
    }
}

/**
 * Aktualisiert die Modal-Tags-UI.<br>
 * Fügt den Delete Buttons für die Tags ein Event Listener hinzu, und bei ausgelöstem Klick-Event {@link handleTagDelete} aufruft
 * @param modalTags HTMLElement
 * @param tags string
 */
function updateModalTags(modalTags: HTMLDivElement, tags: string) {
    modalTags.innerHTML = "";
    if (tags.length > 0) {
        tags.split(", ").forEach(tag => {
            const colDiv = document.createElement("div") as HTMLDivElement;
            colDiv.classList.add("col");

            const tagElement = document.createElement("p") as HTMLParagraphElement;
            tagElement.classList.add("badge", "bg-light", "text-dark");
            tagElement.textContent = tag;

            const delBtn = document.createElement("button") as HTMLButtonElement;
            delBtn.classList.add("btn", "btn-close");
            delBtn.setAttribute("aria-label", "Tag entfernen");

            delBtn.addEventListener("click", async () => await handleTagDelete((delBtn.closest("p") as HTMLParagraphElement).textContent as string, colDiv));

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
    (document.querySelector("#edit-name") as HTMLInputElement).value = "";
    (document.querySelector("#edit-date") as HTMLInputElement).value = "";
    (document.querySelector("#addTagInput") as HTMLInputElement).value = "";
}


/**
 * Fügt einen Event-Listener zum Hinzufügen eines Tags hinzu<br>
 * und ruft {@link handleTagAdd} mit der entsprechenden extrahierten photoID und dem tagNamen auf.
 */
function attachAddTagListener() {
    document.addEventListener("DOMContentLoaded", () => {
        const submitAddTagInput = document.querySelector("#submitAddTagInput") as HTMLButtonElement;
        submitAddTagInput.addEventListener("click", async () => {
            const tagName = (document.querySelector("#addTagInput") as HTMLInputElement).value;
            const photoID = Number((document.querySelector("#modal-img") as HTMLImageElement).getAttribute("data-id") as string);
            await handleTagAdd(photoID, tagName);
        });
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
async function handleTagAdd(photoID: number, tagName: string) {
    try {
        const reqData = {
            photoID: photoID,
            tag: tagName
        };

        const res: Response = await fetch("http://localhost:8080/photos/tag", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(reqData)
        });

        const errorContainer = document.querySelector("#error-edit-photo-container") as HTMLDivElement;
        if (res.status == 201) {
            renderError(errorContainer, true);

            const img = document.querySelector(`img[data-id='${photoID}']`) as HTMLImageElement;
            let tags = img.dataset.tags as string;
            if (tags.length == 0) {
                tags = tagName;
            } else {
                tags = tags + `, ${tagName}`;
            }
            img.dataset.tags = tags;
            updateModalUI(extractPhotoData(img));
        } else {
            const data: { message: string } = await res.json();
            renderError(errorContainer, false, data.message);
        }
    } catch (error) {
        console.error("Error POST /tag", error);
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
async function handleTagDelete(tag: string, colDiv: HTMLDivElement) {
    const img = document.querySelector("#modal-img") as HTMLImageElement;
    const imgId = img.dataset.id as string;

    const reqData = {
        photoID: imgId,
        tag: tag
    };

    try {
        const res = await fetch("http://localhost:8080/photos/tag", {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(reqData)
        });

        const errorContainer = document.querySelector("#error-edit-photo-container") as HTMLDivElement;
        if (res.status == 204) {
            renderError(errorContainer, true);

            // Remove Element from DOM
            colDiv.remove();

            // Aktualisiere die Tags des Bildes
            const imgElement = document.querySelector(`img[data-id='${imgId}']`) as HTMLImageElement;
            if (imgElement) {
                const currentTags = imgElement.getAttribute("data-tags") as string;
                if (currentTags) {
                    const updatedTags = currentTags.split(", ").filter(t => t != tag).join(", ");
                    imgElement.setAttribute("data-tags", updatedTags);
                }
            }
        } else {
            const data: { message: string } = await res.json();
            renderError(errorContainer, false, data.message);
        }
    } catch (error) {
        console.error("Error DELETE /tag", error);
    }
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
        (document.querySelector("#submit-edit-name") as HTMLButtonElement).addEventListener("click", async () => {
            try {
                const photoID = Number((document.querySelector("#modal-img") as HTMLImageElement).getAttribute("data-id"));
                const reqData = {
                    photoID: photoID,
                    photoTitle: (document.querySelector("#edit-name") as HTMLInputElement).value
                }

                const res = await fetch("http://localhost:8080/photos/photoTitle", {
                    method: "PATCH",
                    credentials: "include",
                    body: JSON.stringify(reqData)
                })

                const data = await res.json();

                const errorContainer = document.querySelector("#error-edit-photo-container") as HTMLDivElement;
                if (res.status == 200) {
                    const img = document.querySelector(`img[data-id='${photoID}']`) as HTMLImageElement;
                    img.setAttribute("title", data.photoTitle);
                    renderError(errorContainer, true);
                    updateModalUI(extractPhotoData(img));
                } else {
                    renderError(errorContainer, false, data.message);
                }
            } catch (error) {
                console.log("Error updating photo's title" + error);
            }
        })
    })
}

editPhotoTitle();


/**
 * GET /username
 */
async function fetchUsername(): Promise<void> {
    try {
        const res: Response = await fetch("/username", {
            method: "GET",
            credentials: "include"
        });

        if (!res.ok) {
            console.error("Error fetching username");
        }

        const data: { username: string, role: string } = await res.json();

        renderUsername(data.username);

    } catch (error) {
        console.error("Error GET /username", error);
    }
}

/**
 * GET /role <br>
 * {@link renderGoToAdminPage}
 */
async function fetchRole() {
    try {
        const res: Response = await fetch("http://localhost:8080/role", {
            method: "GET",
            credentials: "include"
        })
        const data: { role: string } = await res.json()
        renderGoToAdminPage(data.role);
    } catch (error) {
        console.error("Error GET /role" + error);
    }
}

/**
 * Zeigt den Button "Zur Adminseite" nicht an, wenn der Nutzer kein Admin ist.
 * @param role Rolle des Benutzers
 */
function renderGoToAdminPage(role: string): void {
    const goToAdminPageItem = document.querySelector("#go-to-admin-page") as HTMLButtonElement;
    if (role == "ADMIN") {
        goToAdminPageItem.classList.remove("d-none");
    } else {
        goToAdminPageItem.classList.add("d-none");
    }
}

/**
 * Leitet den Nutzer zur Adminseite weiter, wenn dieser auf den entsprechenden Button klickt und als Admin angemeldet ist
 */
function redirectToAdminPage() {
    (document.querySelector("#go-to-admin-page") as HTMLButtonElement).addEventListener("click", async () => {
        try {
            const res = await fetch("http://localhost:8080/protected/admin.html");

            window.location.href = res.url;

        } catch (error) {
            console.error("Error redirecting to Admin-Page")
        }
    })
}

redirectToAdminPage();

/**
 * Funktion zum Rendern des Benutzernamens im DOM
 * @param username Der Benutzername
 */
function renderUsername(username: string) {
    const usernameField = document.querySelector("#username") as HTMLParagraphElement;
    usernameField.textContent = username;
}

/**
 * Extrahiert den Suchparameter aus dem entsprechenden Input-Feld, wenn das Submit-Event des entsprechenden Forms ausgelöst wurde<br>
 * Ruft mit dem extrahierten Suchparameter {@link fetchPhotos} auf
 */
function addSearchPhotosListener() {
    (document.querySelector("#searchPhotos") as HTMLFormElement).addEventListener("submit", async (evt: SubmitEvent) => {
        evt.preventDefault()
        const query = (document.querySelector("#searchPhotosQuery") as HTMLInputElement).value;
        await fetchPhotos(query);
    })
}

addSearchPhotosListener();


/**
 * GET /photos <br>
 * Funktion zum Abrufen aller Fotos eines Benutzers vom Server, optional mit übergebenem Suchparameter
 */
async function fetchPhotos(searchVal?: string): Promise<void> {
    try {
        const res: Response = await fetch("/photos?" + (searchVal ? new URLSearchParams({
            photoTitle: searchVal,
            tag: searchVal
        }).toString() : ""), {
            method: "GET",
            credentials: "include"
        });

        if (!res.ok) {
            console.error("Error fetching photos");
        }

        const data: { photos: Photo[] } = await res.json();

        clearImages(document.querySelector("#main-photos-container .row") as HTMLDivElement);
        data.photos.forEach(photo => renderPhotos(photo));

    } catch (error) {
        console.error("Error GET /photos", error);
    }
}

/**
 * Funktion zum Initialisieren der Seite.
 */
function initializePage(): void {
    document.addEventListener("DOMContentLoaded", async (): Promise<void> => {
        await fetchUsername();
        await fetchPhotos();
        await fetchAlbums();
        await fetchRole();
    });
}

initializePage();

/**
 * Entfernt die Bilder aus dem DOM
 * @param element Das entsprechende Element
 */
function clearImages(element: HTMLElement) {

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
function renderPhotos(photo: Photo): void {
    const {id, imgUrl, title, taken, tags} = photo;

    // Hauptcontainer auswählen
    const mainContainer = document.querySelector("#main-photos-container .row") as HTMLDivElement;

    // Prüfen, ob das Element existiert
    if (!mainContainer) {
        console.error("Container not found");
        return;
    }

    // Erstellen des Bild Containers
    const colDiv = document.createElement("div") as HTMLDivElement;
    colDiv.classList.add("col-sm-6", "col-md-4", "col-lg-3");

    // Erstellen des Bildes
    const img = document.createElement("img") as HTMLImageElement;
    img.classList.add("img-fluid", "gallery-item");
    img.dataset.id = id;
    img.src = `http://localhost:8080/img/${imgUrl}`;
    img.title = title;
    img.dataset.date = taken;

    if (photo.tags) {
        img.dataset.tags = tags;
    } else {
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
async function handleEditPhotoDate(date: string) {
    try {
        const photoID = (document.querySelector("#modal-img") as HTMLImageElement).dataset.id as string;
        const reqData = {
            photoID: photoID,
            date: date
        }

        const res = await fetch("http://localhost:8080/photos/photoDate", {
            method: "PATCH",
            credentials: "include",
            body: JSON.stringify(reqData)
        })

        const data: { message: string, newDate?: string } = await res.json();

        if (res.status == 200) {
            const imgElement = document.querySelector(`img[data-id='${photoID}']`) as HTMLImageElement;
            imgElement.dataset.date = data.newDate;
            updateModalUI(extractPhotoData(imgElement));
            renderError(document.querySelector("#error-edit-photo-container") as HTMLDivElement, true);
        } else {
            renderError(document.querySelector("#error-edit-photo-container") as HTMLDivElement, false, data.message);
        }
    } catch (error) {
        console.error("Error PATCH /photoDate")
    }
}

/**
 * Wartet, bis der entsprechende Button ein click-event auslöst und ruft dann {@link handleEditPhotoDate} mit dem extrahiertem Fotodatum auf.<br>
 */
function editDateListener() {
    document.addEventListener("DOMContentLoaded", () => {
        (document.querySelector("#submit-edit-date") as HTMLButtonElement).addEventListener("click", async () => {
            await handleEditPhotoDate((document.querySelector("#edit-date") as HTMLInputElement).value);
        })
    })
}

editDateListener();

/**
 * Wartet, bis der entsprechende Button zum Löschen eines Fotos ein click-event auslöst und ruft mit der extrahierten photoID {@link handlePhotoDelete} auf
 */
function editDelPhotoBtnListener() {
    (document.querySelector("#del-photo-btn") as HTMLButtonElement).addEventListener("click", async () => {
        await handlePhotoDelete((document.querySelector("#modal-img") as HTMLImageElement).dataset.id as string);
    })
}

editDelPhotoBtnListener();

/**
 * DELETE /img/:photoID
 * @param photoID Die ID des Fotos
 */
async function handlePhotoDelete(photoID: string) {
    try {
        const res = await fetch(`http://localhost:8080/img/${photoID}`, {
            method: "DELETE",
            credentials: "include"
        })

        if (res.status == 204) {
            renderError(document.querySelector("#error-edit-photo-container") as HTMLDivElement, true);
            await fetchPhotos()
            window.location.reload();
        } else {
            const data: { message: string } = await res.json();
            console.log(data.message);
            renderError(document.querySelector("#error-edit-photo-container") as HTMLDivElement, false, data.message);
        }
    } catch (err) {
        console.log(err);
    }
}

//Don't allow Dates that are in the future for Image Date of creation
const addPhotoDate = document.getElementById("addPhotoDate") as HTMLInputElement;
let today = new Date().toISOString().split("T")[0];
addPhotoDate.setAttribute("max", today);

/**
 * Wartet auf das Klick-Event des entsprechenden Buttons und extrahiert name, datum und das Bild<br>
 * Ruft im Anschluss POST /photos auf
 */
function addPhoto() {
    const addPhotoSubmit = document.getElementById("addPhotoSubmit") as HTMLButtonElement;
    addPhotoSubmit.addEventListener("click", async (evt: MouseEvent) => {
        const photoName = (document.getElementById("addPhotoName") as HTMLInputElement).value;
        const photoDate = (document.getElementById("addPhotoDate") as HTMLInputElement).value;
        const photoData = ((document.getElementById("photoUploadBtn") as HTMLInputElement).files as FileList);
        const formData = new FormData();

        formData.append("title", photoName);
        formData.append("taken", photoDate);
        formData.append("photo", photoData[0]);

        try {
            const res: Response = await fetch("http://localhost:8080/photos", {
                method: "POST",
                credentials: "include",
                headers: {}, // hier muss kein header übergeben werden
                body: formData
            });
            const data: { message: string } = await res.json();

            if (res.status == 201) {
                window.location.reload();
                renderError(document.querySelector("#error-add-photo-container") as HTMLDivElement, true);
            } else {
                renderError(document.querySelector("#error-add-photo-container") as HTMLDivElement, false, data.message);
            }
        } catch (error) {
            console.log("ERROR at POST /photos");
        }
    });
}

addPhoto();


// --- ALBEN ---
/**
 * Besonderheit: tags als optionaler kommaseparierter String
 */
interface Album {
    id: number,
    title: string,
    tags?: string
}

/**
 * POST /albums
 * Sendet Daten zur Erstellung eines Albums an den Server
 * Lädt die Seite neu wenn Album erfolgreich erstellt wurde
 */
function addAlbum() {
    const addAlbumSubmit = document.getElementById("addAlbumSubmit") as HTMLButtonElement;
    addAlbumSubmit.addEventListener("click", async () => {
        try {
            const albumName = (document.getElementById("addAlbumName") as HTMLInputElement).value;

            const reqData = {
                title: albumName
            };
            const res: Response = await fetch("http://localhost:8080/albums", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reqData),
            });

            const errorContainer = document.querySelector("#error-add-album-container") as HTMLDivElement;
            if (res.status == 201) {
                renderError(errorContainer, true);
                window.location.reload();
            } else {
                const data: { message: string } = await res.json();
                renderError(errorContainer, false, data.message);
            }
        } catch (error) {
            console.log("ERROR at POST /Albums", error);
        }
    });
}

addAlbum()


/**
 * Wartet auf das Submit Event des entsprechenden Formulars und extrahiere den Wert des Input-Feldes <br>
 * Gebe den Wert des Input-Feldes als Suchparameter an die entsprechende Funktion, die die http-Anfrage tätigt {@link fetchAlbums}
 */
function searchAlbums() {
    (document.querySelector("#searchAlbums") as HTMLFormElement).addEventListener("submit", async (evt: SubmitEvent) => {
        evt.preventDefault();
        const query = (document.querySelector("#searchAlbumsQuery") as HTMLInputElement).value;
        await fetchAlbums(query);
    })
}

searchAlbums();


/**
 * GET /albums <br>
 * Optional mit Suchparameter <br>
 */
async function fetchAlbums(searchParam ?: string) {
    try {
        const res: Response = await fetch("http://localhost:8080/albums?" + (searchParam ? new URLSearchParams({searchParam: searchParam}).toString() : ""), {
            method: "GET",
            credentials: "include"
        });

        if (res.ok) {
            const data: { albums: Album[] } = await res.json();
            renderAlbums(data.albums);
        } else {
            const data: { message: string } = await res.json();
            console.log(res.status + " " + data.message);
        }

    } catch (error) {
        console.error(error);
    }
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
function renderAlbums(albums: Album[]) {
    const displayAlbumsContainer = document.querySelector("#display-albums") as HTMLUListElement;
    // Es existiert immer der Reiter Alle Fotos mit der id = "alleFotos"
    displayAlbumsContainer.innerHTML = `
      <li class="list-group-item d-flex align-items-center">
        <button id="alleFotos" class="btn w-100 d-flex justify-content-start">Alle Fotos</button>
      </li>
  `;

    albums.forEach(album => {
        const {id, title, tags} = album; // DESTRUCTURING
        const albumChild = document.createElement("li") as HTMLElement;
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
    `
        displayAlbumsContainer.appendChild(albumChild);
    })
    showAllPhotos();
    showPhotosFromAlbum();
    attachClickListenerEditAlbum();
    attachDelAlbumListener();
}

/**
 * Selektiere alle Buttons mit der js-target Klasse .del-btns und füge jedem Button ein Event-Listener hinzu (click).<br>
 * Selektiere beim Klick, die ID des Albums, welche als data-attribute im übergeordneten Element gespeichert ist<br>
 * Rufe mit der selektierten Album ID die Funktion auf, die die http-Anfrage an den Server stellt, ein Album zu löschen {@link handleAlbumDelete }
 */
function attachDelAlbumListener() {
    (document.querySelectorAll(".del-btns") as NodeListOf<HTMLButtonElement>).forEach(delBtn => {
        delBtn.addEventListener("click", async () => {
            const closetLi = delBtn.closest("li") as HTMLLIElement;
            const albumID = closetLi.getAttribute("data-album-id") as string;
            await handleAlbumDelete(albumID);
        })
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
async function handleAlbumDelete(albumID: string) {
    try {
        const res = await fetch("http://localhost:8080/albums/" + albumID, {
            method: "DELETE",
            credentials: "include"
        })

        if (res.status == 204) {
            await fetchAlbums();
        } else {
            const data: { message: string } = await res.json();
            console.log(res.status + " " + data.message);
        }

    } catch (err) {
        console.log(err);
    }
}

/**
 * Fügt ein click Event Listener dem entsprechenden Button hinzu und extrahiert den neuen Titel des Albums aus dem Input-Feld sowie die albumID des Albums aus dem
 * Modalcontainer (data attribut).
 * Ruft mit dem neuen Titel und der albumID {@link handlerPatchAlbumsTitle} auf.
 */
function patchAlbumsTitle() {
    const submitEditAlbumNameBtn = document.querySelector("#submit-edit-album-name") as HTMLButtonElement;
    const editAlbumNameInput = document.querySelector("#edit-album-name") as HTMLInputElement;
    submitEditAlbumNameBtn.addEventListener("click", async () => {
        const title = editAlbumNameInput.value;
        const albumID = (document.querySelector("#editAlbumModal") as HTMLDivElement).getAttribute("data-album-id") as string;
        await handlerPatchAlbumsTitle(title, parseInt(albumID));
    })
}

patchAlbumsTitle();

/**
 * PATCH /albums/albumsTitle mit den Parametern als JSON body
 *
 * @param title Der neue Titel des Albums
 * @param albumID Die albumID des Albums
 */
async function handlerPatchAlbumsTitle(title: string, albumID: number) {
    try {
        const res = await fetch("http://localhost:8080/albums/albumsTitle", {
            method: "PATCH",
            credentials: "include",
            body: JSON.stringify({title: title, albumID: albumID})
        })

        const errorContainer = document.querySelector("#error-edit-album-container") as HTMLDivElement;
        if (res.ok) {
            renderError(errorContainer, true);
            const data: { message: string, albumTitle: string } = await res.json();
            console.log(`
                ${res.status}
                ${data.message}
                ${data.albumTitle}
            `);
            (document.querySelector("#album-title") as HTMLHeadingElement).textContent = data.albumTitle; // Aktualisiere das Modal, sodass man nicht das Modal erst schließe und wieder öffnen kann
            await fetchAlbums();
        } else {
            const data: { message: string } = await res.json();
            console.log("called");
            renderError(errorContainer, false, data.message);

            console.log(res.status + " " + data.message);
        }

    } catch (err) {
        console.log(err);
    }
}

/**
 * Füge ein Event-Listener zu allen Edit Album Button hinzu, der auf ein Klick-Event reagiert und {@link extractAlbumData} mit dem entsprechenden geklickten Button aufruft.
 */
function attachClickListenerEditAlbum() {
    const editBtns = document.querySelectorAll(".edit-btns") as NodeListOf<HTMLButtonElement>;
    editBtns.forEach(editBtn => {
        const btn = editBtn;
        editBtn.addEventListener("click", () => extractAlbumData(btn));
    })
}

/**
 * Selektiere die Album-ID, den Titel und die Tags als kommaseparierter String aus dem entsprechenden Album, welches im Modal gerendert werden soll {@link renderAlbumsEditModal}
 * @param editBtn Der geklickte Button des Albums, welches im Modal bearbeitet werden soll
 */
function extractAlbumData(editBtn: HTMLButtonElement) {
    const closestLiElement = editBtn.closest("li") as HTMLElement;
    const data_album_id = closestLiElement.getAttribute("data-album-id") as string;
    const title = (closestLiElement.querySelector(".album-title") as HTMLButtonElement).textContent as string;
    const data_tags = closestLiElement.hasAttribute("data-tags") ? closestLiElement.getAttribute("data-tags") as string : undefined;
    renderAlbumsEditModal(data_album_id, title, data_tags);
}

/**
 * Setze die Eingabefelder des Modals zurück.
 */
function resetEditAlbumsInputFields() {
    const editAlbumNameInput = document.querySelector("#edit-album-name") as HTMLInputElement;
    editAlbumNameInput.value = "";

    const addTagToAlbumInput = document.querySelector("#addTagToAlbumInput") as HTMLInputElement;
    addTagToAlbumInput.value = "";
}

/**
 * Setze die Eingabefelder des Modals zurück {@link resetEditAlbumsInputFields}
 * Bindet die Album-ID und die Tags des Albums als kommaseparierter String an den Container des Modals
 * Rendert die Tags des Albums {@link renderAlbumsTags}
 */
function renderAlbumsEditModal(data_album_id: string, title: string, data_tags: string | undefined) {
    resetEditAlbumsInputFields();

    const editAlbumModalContainer = document.querySelector("#editAlbumModal") as HTMLDivElement;
    editAlbumModalContainer.setAttribute("data-album-id", data_album_id);
    (document.querySelector("#album-title") as HTMLElement).textContent = title;

    renderAlbumsTags(data_tags);
}

/**
 * Rendert die Tags des Albums im Modal und ruft im Anschluss {@link attachDelTagFromAlbumListener} auf
 * @param data_tags
 */
function renderAlbumsTags(data_tags: string | undefined) {
    const tagsContainer = document.querySelector("#album-tags .row") as HTMLDivElement;
    tagsContainer.innerHTML = "";
    data_tags?.split(", ").forEach(tag => {
        const tagContainer = document.createElement("div");
        tagContainer.className = "col";
        tagContainer.innerHTML = `
        <p class="badge bg-light text-dark">
            ${tag}
            <button class="btn btn-close del-tag-album-btn" aria-label="Tag entfernen"> <!-- KONVENTION: Jeder Button, um den Tag zu entfernen hat die js Targetklasse del-tag-album-btn -->
            </button>
        </p>
      `
        tagsContainer.append(tagContainer);
    })

    attachDelTagFromAlbumListener();
}

/**
 * Funktion, die darauf wartet, dass der benutzer ein Button anklickt, um einen Tag zu löschen. Der Tagname wird extrahiert und die Album-ID aus dem Modal Container.<br>
 * Damit wird {@link handleTagDeleteFromAlbum} aufgerufen
 */
function attachDelTagFromAlbumListener() {
    const delTagFromAlbumBtns = document.querySelectorAll(".del-tag-album-btn") as NodeListOf<HTMLButtonElement>;
    delTagFromAlbumBtns.forEach(delTagFromAlbumBtn => {
        delTagFromAlbumBtn.addEventListener("click", async () => {
            const albumID = (delTagFromAlbumBtn.closest("#editAlbumModal") as HTMLDivElement).getAttribute("data-album-id") as string;
            const tag = (delTagFromAlbumBtn.closest("p") as HTMLParagraphElement).textContent as string;
            await handleTagDeleteFromAlbum(tag.trim(), parseInt(albumID));
        })
    })
}

/**
 * DELETE /albums/tag
 * @param tag Der Tagname wird im JSON übertragen
 * @param albumID Die Album-ID wird ebenfalls im JSON übertragen
 */
async function handleTagDeleteFromAlbum(tag: string, albumID: number) {
    try {

        const res = await fetch("http://localhost:8080/albums/tag", {
            method: "DELETE",
            credentials: "include",
            body: JSON.stringify({tag: tag, albumID: albumID})
        })

        if (res.status == 204) {
            await fetchAlbums();
            const albumLiElement = document.querySelector(`#albumOffcans li[data-album-id='${albumID}']`) as HTMLLIElement;
            const tags = albumLiElement.hasAttribute("data-tags") ? albumLiElement.getAttribute("data-tags") as string : undefined;
            renderAlbumsTags(tags);
        } else {
            const data: { message: string } = await res.json();
            console.log(`${res.status, data.message}`);
        }

    } catch (err) {
        console.log(err);
    }
}


/**
 * Funktion, die darauf wartet, dass der Nutzer den Button klickt, um einen Tag hinzuzufügen.<br>
 * Wenn der Button gedrückt wird, wird der Name des Tags sowie die Album-ID des Modalcontainers extrahiert und {@link handlerAddTagToAlbum} aufgerufen
 */
function addTagToAlbum() {
    const submitAddTagToAlbumBtn = document.getElementById("submitAddTagToAlbumInput") as HTMLButtonElement;
    submitAddTagToAlbumBtn.addEventListener("click", async () => {
        const tag = (document.getElementById("addTagToAlbumInput") as HTMLInputElement).value;
        const albumID = (document.querySelector("#editAlbumModal") as HTMLDivElement).getAttribute("data-album-id") as string;
        await handlerAddTagToAlbum(tag, parseInt(albumID));
    })
}

addTagToAlbum();

/**
 * POST /albums/tag
 * @param tag Wird als JSON im Body übertragen
 * @param albumID Wird als JSON im Body übertragen
 */
async function handlerAddTagToAlbum(tag: string, albumID: number) {
    try {
        const res = await fetch("http://localhost:8080/albums/tag", {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({tag: tag, albumID: albumID})
        })

        const errorContainer = document.querySelector("#error-edit-album-container") as HTMLDivElement;
        if (res.status == 201) {
            renderError(errorContainer, true);
            const data: { message: string } = await res.json();
            console.log(res.status + " " + data.message);
            await fetchAlbums();

            const albumLiElement = document.querySelector(`#albumOffcans li[data-album-id='${albumID}']`) as HTMLLIElement;

            renderAlbumsTags(albumLiElement.getAttribute("data-tags") as string || undefined);

        } else {
            const data: { message: string } = await res.json();
            renderError(errorContainer, false, data.message);
            console.log(res.status + " " + data.message);
        }

    } catch (err) {
        console.log(err);
    }
}

/**
 * Füge einen Event-Listener hinzu, der auf den Click auf "Alle Fotos" in der Sidebar wartet und alle Fotos anzeigt
 * {@link fetchPhotos}
 */
function showAllPhotos() {
    (document.querySelector("#alleFotos") as HTMLButtonElement).addEventListener("click", () => fetchPhotos());
}

/**
 * Füge jedem Albumname (Button) ein Klick-Event-Listener hinzu, der die zugehörige Album-ID selektiert und diese als Argument an {@link fetchPhotosFromAlbum} übergibt.
 */
function showPhotosFromAlbum() {
    const albumsBtns = document.querySelectorAll(".album-title") as NodeListOf<HTMLButtonElement>;
    albumsBtns.forEach(albumBtn => {
        albumBtn.addEventListener("click", async () => {
            const albumID = (albumBtn.closest("li") as HTMLElement).getAttribute("data-album-id") as string;
            await fetchPhotosFromAlbum(parseInt(albumID));
        })
    })
}

/**
 * GET /photos/:albumID
 *
 * @param albumID Die ID des Albums aus welchem die Fotos angezeigt werden sollen
 */
async function fetchPhotosFromAlbum(albumID: number) {
    try {
        const res: Response = await fetch(`/photos/${albumID}`, {
            method: "GET",
            credentials: "include"
        });

        if (!res.ok) {
            const data: { message: string } = await res.json();
            console.log(res.status + " " + data.message);
        }

        const data: { photos: Photo[] } = await res.json();

        clearImages(document.querySelector("#main-photos-container .row") as HTMLDivElement);
        data.photos.forEach(photo => renderPhotos(photo));

    } catch (error) {
        console.error("Error GET /photos/:albumID", error);
    }
}


function createAlbumList(albums: { id: number, title: string, contains: boolean }[]): void {
    const albumMenu = document.getElementById('albumMenu') as HTMLUListElement;
    albumMenu.innerHTML = ''; // Clear existing items

    albums.forEach(album => {
        const listItem = document.createElement('li');
        const formCheck = document.createElement('div');
        formCheck.className = 'form-check form-switch';

        const input = document.createElement('input');
        input.className = 'form-check-input';
        input.type = 'checkbox';
        input.id = `switch-${album.id}`;
        input.checked = album.contains;
        input.addEventListener('change', (event) => handleSwitchChange(event, album.id));

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = input.id;
        label.textContent = `In ${album.title}`;

        formCheck.appendChild(input);
        formCheck.appendChild(label);
        listItem.appendChild(formCheck);

        albumMenu.appendChild(listItem);
    });
}

async function photoIsInAlbum(photoID: number) {
    const res = await fetch("http://localhost:8080/albums/contains/" + photoID, {
        method: "GET",
        credentials: "include",
    })

    if (res.ok) {
        const data: { id: number, title: string, contains: boolean }[] = await res.json();
        return data;
    } else {
        const data: { message: string } = await res.json();
        console.log(res.status + " " + data.message);
        return data;
    }
}


async function handleSwitchChange(evt: Event, albumID: number) {
    const input = evt.target as HTMLInputElement;
    const photoID = (document.querySelector("#modal-img") as HTMLImageElement).getAttribute("data-id") as string;

    const reqData = {
        photoID: photoID,
        albumID: albumID
    }

    if (input.checked) {

        try {
            const res = await fetch("http://localhost:8080/albums/photo", {
                method: "POST",
                credentials: "include",
                body: JSON.stringify(reqData)
            })

            if (res.status != 201) {
                const data: { messsage: string } = await res.json()
                console.log(res.status + " " + data.messsage);
            }

        } catch (err) {
            console.log(err);
        }

    } else {
        const res = await fetch("http://localhost:8080/albums/photo", {
            method: "DELETE",
            credentials: "include",
            body: JSON.stringify(reqData)
        })

        if (res.status != 204) {
            const data: { message: string } = await res.json();
            console.log(res.status + " " + data.message);
        }
    }

}


// --- ALBEN ---
