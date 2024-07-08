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
const logoutBtn = document.querySelector("#logout-btn");
/**
 * POST /logout, wenn der Logout Button geklickt wird
 * Verarbeitet serverseitigen redirect bei erfolgreichem Logout
 */
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
/*
TODO: Schalgworte der Bilder sowie das Datum sollten im Modal angezeigt werden
 */
/**
 * Öffnet ein Bootstrap Mdoalfenster
 * Modalheader: Hier steht der Bildtitel des entsprechend angeklickten Bildes.
 * Modalbody: Hier wird das entsprechend angeklickte Bild vergrößert angezeigt. Des Weiteren befindet sich hier ein Eingabefeld, um den Titel des Bildes zu ändern.
 * Modalfooter: Hier gibt es einen Button, um die Änderungen zu speichern, sowie einen weiteren Button, um das Bild zu entfernen.
 */
document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('gallery-item')) { // KONVENTION: Jedes Bild besitzt die Klasse '.gallery-item'
        const src = target.getAttribute('src');
        const title = target.getAttribute('title'); // KONVENTION: In dem 'title' Attribut steht der Titel des Bildes
        const taken = target.getAttribute("data-date");
        console.log(taken);
        const imageTitle = document.querySelector('#image-title');
        const modalImg = document.querySelector('#modal-img');
        const modalTaken = document.querySelector("#taken");
        const modalEditTitle = document.querySelector('#edit-name');
        imageTitle.textContent = title;
        modalImg.setAttribute('src', src);
        modalTaken.textContent = `Aufnahmedatum: ${taken}`;
        modalEditTitle.value = ""; // Setze den Wert des Input-Feldes zurück, wenn das Modal geöffnet wird
    }
});
document.addEventListener("DOMContentLoaded", () => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield fetch("/photos", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const data = yield res.json();
    // console.log(data);
    data.photos.forEach(photo => insertPhotos(photo.title, photo.taken, `http://localhost:8080/img/${photo.url}`));
}));
/**
 * Fügt ein Bild in den DOM ein.
 * Dabei werden die Attribute src, title, date-date und data-tags gesetzt
 * https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes
 * Des Weiteren werden die für Bootstrap erforderlichen Attribute dem <img> Tag hinzugefügt
 * @param title Titel des Bildes
 * @param taken Aufnahmedatum des Bildes
 * @param url Pfad URL des Bildes
 * @param tags Tags des Bildes, getrennt mit Schlagworten
 */
function insertPhotos(title, taken, url, tags) {
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
    img.src = url;
    if (tags) {
        img.dataset.tags = tags.join(",");
    }
    // Für das Bootstrap modal erforderliche Attribute setzen
    img.setAttribute("data-bs-toggle", "modal");
    img.setAttribute("data-bs-target", "#gallery-modal");
    // Bild in den Bild Container einfügen
    colDiv.appendChild(img);
    // Bild-Container in den Hauptcontainer einfügen
    mainContainer.appendChild(colDiv);
}
