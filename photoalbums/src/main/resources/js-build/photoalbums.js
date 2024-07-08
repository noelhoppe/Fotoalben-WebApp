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
        console.log(target);
        const src = target.getAttribute('src');
        const title = target.getAttribute('title'); // KONVENTION: In dem 'title' Attribut steht der Titel des Bildes
        const imageTitle = document.querySelector('#image-title');
        const modalImg = document.querySelector('#modal-img');
        const modalEditTitle = document.querySelector('#edit-name');
        console.log(imageTitle);
        console.log(modalImg);
        console.log(modalEditTitle);
        imageTitle.textContent = title;
        modalImg.setAttribute('src', src);
        modalEditTitle.value = ""; // Setze den Wert des Input-Feldes zurück, wenn das Modal geöffnet wird
    }
});
document.addEventListener("DOMContentLoaded", () => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield fetch("http://localhost:8080/img/1.jpg", {
        method: "GET",
        credentials: "include"
    });
    const data = yield res.blob();
    insertPhotos("test", "2022-12-12", URL.createObjectURL(data));
    /*
    const imgUrl = URL.createObjectURL(data);
    const imgElement = document.createElement("img");
    console.log(imgElement);
    imgElement.src = imgUrl;
    document.body.appendChild(imgElement);
     */
}));
/**
 * Fügt ein Bild in den DOM ein. Dabei werden die Attribute src, title, dataset.taken und dataset.tags
 * img.src = url;
 * https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes
 * @param title Titel des Bildes
 * @param taken Aufnahmedatum des Bildes
 * @param url Pfad URL des Bildes
 * @param tags Tags des Bildes, getrennt mit Schlagworten
 */
function insertPhotos(title, taken, url, tags) {
    // Hauptcontainer auswählen
    const mainContainer = document.querySelector("#main-photos-container .row");
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
    // Bild in den Bild Container einfügen
    colDiv.appendChild(img);
    // Bild-Container in den Hauptcontainer einfügen
    mainContainer.appendChild(colDiv);
}
