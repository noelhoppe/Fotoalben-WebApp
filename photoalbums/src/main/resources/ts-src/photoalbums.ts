const logoutBtn = document.querySelector("#logout-btn") as HTMLButtonElement;
console.log(logoutBtn);
logoutBtn.addEventListener("click", async() => {
  console.log("clicked");
  const res = await fetch("http://localhost:8080/logout", {
    method : "POST",
    credentials : "include",
    headers : {
      "Content-Type" : "application/json"
    }
  });
  const data : string = await res.json();
  if (res.ok) {
    window.location.href = "/login.html";
  } else {
    console.log(data);
  }
})

/*
TODO: Schalgworte der Bilder sowie das Datum sollten im Modal angezeigt werden
 */
/**
 * Öffnet ein Bootstrap Mdoalfenster
 * Modalheader: Hier steht der Bildtitel des entsprechend angeklickten Bildes.
 * Modalbody: Hier wird das entsprechend angeklickte Bild vergrößert angezeigt. Des Weiteren befindet sich hier ein Eingabefeld, um den Titel des Bildes zu ändern.
 * Modalfooter: Hier gibt es einen Button, um die Änderungen zu speichern, sowie einen weiteren Button, um das Bild zu entfernen.
 */
document.addEventListener('click', (e: MouseEvent) => {
  const target : HTMLElement = e.target as HTMLElement;
  if (target.classList.contains('gallery-item')) { // KONVENTION: Jedes Bild besitzt die Klasse '.gallery-item'
    // console.log(target);

    const src : string = target.getAttribute('src') as string;
    const title : string = target.getAttribute('title') as string; // KONVENTION: In dem 'title' Attribut steht der Titel des Bildes

    const imageTitle : HTMLElement = document.querySelector('#image-title') as HTMLElement;
    const modalImg : HTMLImageElement = document.querySelector('#modal-img') as HTMLImageElement;
    const modalEditTitle : HTMLInputElement = document.querySelector('#edit-name') as HTMLInputElement;

    imageTitle.textContent = title;
    modalImg.setAttribute('src', src);
    modalEditTitle.value = ""; // Setze den Wert des Input-Feldes zurück, wenn das Modal geöffnet wird
  }
});
