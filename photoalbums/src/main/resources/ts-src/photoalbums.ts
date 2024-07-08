interface Photo {
  title: string;
  taken: string;
  url: string;
}

const logoutBtn = document.querySelector("#logout-btn") as HTMLButtonElement;
/**
 * POST /logout, wenn der Logout Button geklickt wird
 * Verarbeitet serverseitigen redirect bei erfolgreichem Logout
 */
logoutBtn.addEventListener("click", async() => {
  const res = await fetch("http://localhost:8080/logout", {
    method : "POST",
    redirect : "follow",
    credentials : "include",
    headers : {
      "Content-Type" : "application/json"
    }
  });
  if (res.redirected) {
    window.location.href = res.url; // https://stackoverflow.com/questions/39735496/redirect-after-a-fetch-post-call
  } else {
    const data : string = await res.json();
    console.log(data);
  }
})

/*
TODO: Schlagworte sollten im Modal angezeigt werden
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

    const src : string = target.getAttribute('src') as string;
    const title : string = target.getAttribute('title') as string; // KONVENTION: In dem 'title' Attribut steht der Titel des Bildes
    const taken : string = target.getAttribute("data-date") as string;
    console.log(taken);

    const imageTitle : HTMLElement = document.querySelector('#image-title') as HTMLElement;
    const modalImg : HTMLImageElement = document.querySelector('#modal-img') as HTMLImageElement;
    const modalTaken : HTMLParagraphElement = document.querySelector("#taken") as HTMLParagraphElement;
    const modalEditTitle : HTMLInputElement = document.querySelector('#edit-name') as HTMLInputElement;

    imageTitle.textContent = title;
    modalImg.setAttribute('src', src);
    modalTaken.textContent = `Aufnahmedatum: ${taken}`;
    modalEditTitle.value = ""; // Setze den Wert des Input-Feldes zurück, wenn das Modal geöffnet wird
  }
});

const usernameField = document.querySelector("#username") as HTMLParagraphElement;
document.addEventListener("DOMContentLoaded", async () => {
  const resGetUsername : Response = await fetch("/username", {
    method : "GET",
    credentials : "include",
    headers : {
      "Content-Type" : "application/json"
    },
  });

  const dataGetUsername = await resGetUsername.json();
  usernameField.textContent = dataGetUsername.username;

  const resGetPhotos : Response = await fetch("/photos", {
    method : "GET",
    credentials : "include",
    headers : {
      "Content-Type" : "application/json"
    }
  })

  const dataGetPhotos : { photos : Photo[] } = await resGetPhotos.json();
  // console.log(dataGetPhotos);

  dataGetPhotos.photos.forEach(photo  => insertPhotos(photo.title, photo.taken, `http://localhost:8080/img/${photo.url}`));
})

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
function insertPhotos(title : string, taken : string, url : string, tags?:string[]) : void {
  // Hauptcontainer auswählen
  const mainContainer = document.querySelector("#main-photos-container .row") as HTMLDivElement;

  // Prüfen, ob das Element existiert
  if (!mainContainer) {
    console.log("Container not found");
    return;
  }

  // Erstellen des Bild Containers
  const colDiv = document.createElement("div") as HTMLDivElement;
  colDiv.classList.add("col-sm-6", "col-md-4", "col-lg-3");

  // Erstellen des Bildes
  const img = document.createElement("img") as HTMLImageElement;
  img.classList.add("img-fluid", "gallery-item");
  img.title = title;
  img.dataset.date = taken;
  img.src = url;
  if (tags) {
    img.dataset.tags = tags.join(",")
  }

  // Für das Bootstrap modal erforderliche Attribute setzen
  img.setAttribute("data-bs-toggle", "modal");
  img.setAttribute("data-bs-target", "#gallery-modal");

  // Bild in den Bild Container einfügen
  colDiv.appendChild(img);

  // Bild-Container in den Hauptcontainer einfügen
  mainContainer.appendChild(colDiv);
}