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
 * Funktion zum Abmelden des Benutzers
 */
function logout() {
    const logoutBtn = document.querySelector("#logout-btn");
    logoutBtn.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
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
            console.log(data);
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
 * Updates the modal UI with the extracted photo data.
 * @param photoData A Photo object containing the photo data.
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
            delBtn.addEventListener("click", () => handleTagDelete(delBtn, tag, colDiv));
            tagElement.appendChild(delBtn);
            colDiv.appendChild(tagElement);
            modalTags.appendChild(colDiv);
        });
    }
}
/**
 * Behandelt das Löschen eines Tags.
 * @param delBtn HTMLButtonElement
 * @param tag string
 * @param colDiv HTMLDivElement
 */
function handleTagDelete(delBtn, tag, colDiv) {
    return __awaiter(this, void 0, void 0, function* () {
        const img = document.querySelector("#modal-img");
        const imgId = img.dataset.id;
        const reqData = {
            imgId: imgId,
            tag: tag
        };
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
    });
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
 * Funktion zum Abrufen des Benutzernamens vom Server
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
            console.error("Error fetching username", error);
        }
    });
}
/**
 * Funktion zum Rendern des Benutzernamens im DOM
 * @param username Der Benutzername
 */
function renderUsername(username) {
    const usernameField = document.querySelector("#username");
    usernameField.textContent = username;
}
/**
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
            console.error("Error fetching photos", error);
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
    // Für das Bootstrap modal erforderliche Attribute setzen
    img.setAttribute("data-bs-toggle", "modal");
    img.setAttribute("data-bs-target", "#gallery-modal");
    // Bild in den Bild Container einfügen
    colDiv.appendChild(img);
    // Bild-Container in den Hauptcontainer einfügen
    mainContainer.appendChild(colDiv);
}
/*
const addAlbumSubmit = document.getElementById("addAlbumSubmit") as HTMLButtonElement;
addAlbumSubmit.addEventListener("click", async (evt: MouseEvent)=> {
  const albumName = (document.getElementById("addAlbumName")as HTMLInputElement).value;
  const reqData = {
    album : {
      title : albumName

    }
  };

  const res : Response = await fetch( "http://localhost:8080/albums", {
    method: "POST",
    credentials : "include",
    headers : {
      "Content-Type" : "application/json"
    },
    body : JSON.stringify(reqData),
  });
  // const data = await res.json(-);
});

//Don't allow Dates that are in the future for Image Date of creation
const addPhotoDate = document.getElementById("addPhotoDate") as HTMLInputElement;
let today = new Date().toISOString().split("T")[0];
addPhotoDate.setAttribute("max", today);

const addPhotoSubmit = document.getElementById("addPhotoSubmit") as HTMLButtonElement;
addPhotoSubmit.addEventListener("click", async (evt: MouseEvent)=> {
  const photoName = (document.getElementById("addPhotoName")as HTMLInputElement).value;
  const photoDate = (document.getElementById("addPhotoDate") as HTMLInputElement).value;
  const photoData =((document.getElementById("photoUploadBtn") as HTMLInputElement).files as FileList);
  const formData = new FormData();

  formData.append("title", photoName);
  formData.append("taken", photoDate);
  formData.append("photo", photoData[0]);


  const res : Response = await fetch("http://localhost:8080/photos", {
    method: "POST",
    credentials : "include",
    headers : {
      "Content-Type" : "multipart/form-data"
    },
    body : formData
  });
  const data = await res.json();
});

 */ 
