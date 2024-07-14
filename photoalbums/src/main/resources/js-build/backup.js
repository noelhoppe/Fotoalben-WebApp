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
// Zentrale Datenstruktur
const photos = [];
/**
 * POST /logout, wenn der Logout Button geklickt wird
 * Verarbeitet serverseitigen redirect bei erfolgreichem Logout und löscht die Session
 */
const logoutBtn = document.querySelector("#logout-btn");
logoutBtn.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield fetch("http://localhost:8080/logout", {
        method: "POST",
        redirect: "follow",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        }
    });
    if (res.redirected) {
        window.location.href = res.url; // https://stackoverflow.com/questions/39735496/redirect-after-a-fetch-post-call
    }
    else {
        const data = yield res.json();
        console.log(data);
    }
}));
/**
 * Öffnet ein Bootstrap Modalfenster
 * MODALHEADER: Hier steht der Bildtitel des entsprechend angeklickten Bildes.
 * MODALBODY: Hier wird das entsprechend angeklickte Bild vergrößert angezeigt. Außerdem wird das Aufnahmedatum und die Schlagworte angezeigt.
 * Des Weiteren befindet sich hier ein Eingabefeld, um den Titel des Bildes zu ändern sowie ein Eingabefeld, um Schlagworte hinzuzufügen
 * MODALFOOTER: Hier gibt es einen Button, um die Änderungen zu speichern, d.h Tags hinzuzufügen oder den Titel zu ändern sowie einen weiteren Button, um das Bild zu entfernen.
 */
document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('gallery-item')) { // KONVENTION: Jedes Bild besitzt die Klasse '.gallery-item'
        // Selektiere die Attribute aus dem Bild
        const title = target.getAttribute('title'); // KONVENTION: In dem 'title' Attribut steht der Titel des Bildes
        const id = target.getAttribute("data-id");
        const src = target.getAttribute('src');
        const taken = target.getAttribute("data-date"); // https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes
        const tags = target.getAttribute("data-tags"); // https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes; tags sind kommasepariert abgespeichert
        // Selektiere die Elemente des Modalfensters
        const imageTitle = document.querySelector('#image-title');
        const modalImg = document.querySelector('#modal-img');
        const modalTaken = document.querySelector("#taken");
        const modalTags = document.querySelector("#tags .row");
        // console.log(modalTags);
        // Setze Titel, Bild und Aufnahmedatum
        imageTitle.textContent = title;
        modalImg.setAttribute("data-id", id);
        modalImg.setAttribute('src', src);
        modalTaken.textContent = `Aufnahmedatum: ${taken}`;
        // Setze die tags
        modalTags.innerHTML = "";
        tags.split(", ").forEach(tag => {
            // console.log("called");
            // console.log(tag);
            const colDiv = document.createElement("div");
            colDiv.classList.add("col");
            const tagElement = document.createElement("p");
            tagElement.classList.add("badge", "bg-light", "text-dark");
            tagElement.textContent = tag;
            const delBtn = document.createElement("button");
            delBtn.classList.add("btn", "btn-close");
            delBtn.setAttribute("aria-label", "Tag entfernen");
            delBtn.setAttribute("id", "deleteTag");
            delBtn.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
                console.log("clicked");
                const img = document.querySelector("#modal-img");
                const imgId = img.dataset.id;
                console.log(imgId);
                const span = delBtn.parentElement;
                const tag = span.textContent;
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
                console.log(res.status); // Logge, ob das Löschen erfolgreich war
                if (res.status == 204) {
                    window.location.reload();
                }
            }));
            tagElement.appendChild(delBtn);
            colDiv.appendChild(tagElement);
            modalTags.appendChild(colDiv);
        });
    }
    // Setze den Wert des Input-Feldes zurück, wenn das Modal geöffnet wird
    const modalEditTitle = document.querySelector('#edit-name');
    modalEditTitle.value = "";
    // Setze den Wert des Input-Feldes zurück, wenn das Modal geöffnet wird
    const addTagInput = document.querySelector("#addTagInput");
    addTagInput.value = "";
});
/**
 * Wenn die Seite geladen wird:
 * GET /username
 * GET /photos
 */
const usernameField = document.querySelector("#username");
document.addEventListener("DOMContentLoaded", () => __awaiter(void 0, void 0, void 0, function* () {
    const resGetUsername = yield fetch("/username", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
    });
    const dataGetUsername = yield resGetUsername.json();
    usernameField.textContent = dataGetUsername.username;
    const resGetPhotos = yield fetch("/photos", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const dataGetPhotos = yield resGetPhotos.json();
    // console.log(dataGetPhotos);
    dataGetPhotos.photos.forEach(photo => insertPhotos(photo.id, photo.title, photo.taken, `http://localhost:8080/img/${photo.url}`, photo.tags == null ? "" : photo.tags));
}));
/**
 * Fügt ein Bild in den DOM ein.
 * Dabei werden die Attribute src, title, date-date und data-tags gesetzt
 * https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes
 * Des Weiteren werden die für Bootstrap erforderlichen Attribute dem <img> Tag hinzugefügt
 * @param id Eindeutige id des Fotos
 * @param title Titel des Bildes
 * @param taken Aufnahmedatum des Bildes
 * @param url Pfad URL des Bildes
 * @param tags Tags des Bildes, getrennt mit Schlagworten
 */
function insertPhotos(id, title, taken, url, tags) {
    // Hauptcontainer auswählen
    const mainContainer = document.querySelector("#main-photos-container .row");
    // Prüfen, ob das Element existiert
    if (!mainContainer) {
        console.log("Container not found");
        return;
    }
    // Erstellen des Bild Containers
    const colDiv = document.createElement("div");
    colDiv.classList.add("col-sm-6", "col-md-4", "col-lg-3");
    // Erstellen des Bildes
    const img = document.createElement("img");
    img.classList.add("img-fluid", "gallery-item");
    img.title = title;
    img.dataset.date = taken;
    img.dataset.id = id;
    img.src = url;
    if (tags) {
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
    const res = yield fetch("http://localhost:8080/photos", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "multipart/form-data"
        },
        body: formData
    });
    const data = yield res.json();
}));
