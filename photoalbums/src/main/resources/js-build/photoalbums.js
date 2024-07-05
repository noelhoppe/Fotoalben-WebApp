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
console.log(logoutBtn);
logoutBtn.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("clicked");
    const res = yield fetch("http://localhost:8080/logout", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const data = yield res.json();
    if (res.ok) {
        window.location.href = "/login.html";
    }
    else {
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
        // console.log(target);
        const src = target.getAttribute('src');
        const title = target.getAttribute('title'); // KONVENTION: In dem 'title' Attribut steht der Titel des Bildes
        const imageTitle = document.querySelector('#image-title');
        const modalImg = document.querySelector('#modal-img');
        const modalEditTitle = document.querySelector('#edit-name');
        imageTitle.textContent = title;
        modalImg.setAttribute('src', src);
        modalEditTitle.value = ""; // Setze den Wert des Input-Feldes zurück, wenn das Modal geöffnet wird
    }
});
