/**
 * Datentyp eines Fotos. Welche Attribute hat ein Foto?
 */
interface Photo {
  title: string;
  taken: string;
  url: string;
  tags?:string; // tags als kommaseparierter String
}

/**
 * POST /logout, wenn der Logout Button geklickt wird
 * Verarbeitet serverseitigen redirect bei erfolgreichem Logout und löscht die Session
 */
const logoutBtn = document.querySelector("#logout-btn") as HTMLButtonElement;
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

/**
 * Öffnet ein Bootstrap Modalfenster
 * MODALHEADER: Hier steht der Bildtitel des entsprechend angeklickten Bildes.
 * MODALBODY: Hier wird das entsprechend angeklickte Bild vergrößert angezeigt. Außerdem wird das Aufnahmedatum und die Schlagworte angezeigt.
 * Des Weiteren befindet sich hier ein Eingabefeld, um den Titel des Bildes zu ändern sowie ein Eingabefeld, um Schlagworte hinzuzufügen
 * MODALFOOTER: Hier gibt es einen Button, um die Änderungen zu speichern, d.h Tags hinzuzufügen oder den Titel zu ändern sowie einen weiteren Button, um das Bild zu entfernen.
 */
document.addEventListener('click', (e: MouseEvent) => {
  const target : HTMLElement = e.target as HTMLElement;
  if (target.classList.contains('gallery-item')) { // KONVENTION: Jedes Bild besitzt die Klasse '.gallery-item'

    // Selektiere die Attribute aus dem Bild
    const title : string = target.getAttribute('title') as string; // KONVENTION: In dem 'title' Attribut steht der Titel des Bildes
    const src : string = target.getAttribute('src') as string;
    const taken : string = target.getAttribute("data-date") as string; // https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes
    const tags : string = target.getAttribute("data-tags") as string; // https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes; tags sind kommasepariert abgespeichert

    // Selektiere die Elemente des Modalfensters
    const imageTitle : HTMLElement = document.querySelector('#image-title') as HTMLElement;
    const modalImg : HTMLImageElement = document.querySelector('#modal-img') as HTMLImageElement;
    const modalTaken : HTMLParagraphElement = document.querySelector("#taken") as HTMLParagraphElement;
    const modalTags = document.querySelector("#tags .row") as HTMLParagraphElement;
    console.log(modalTags);

    // Setze Titel, Bild und Aufnahmedatum
    imageTitle.textContent = title;
    modalImg.setAttribute('src', src);
    modalTaken.textContent = `Aufnahmedatum: ${taken}`;

    // Setze die tags
    modalTags.innerHTML = "";
    tags.split(", ").forEach(tag => {
      console.log("called");
      console.log(tag);
      const colDiv = document.createElement("div") as HTMLDivElement;
      colDiv.classList.add("col");

      const tagElement = document.createElement("p") as HTMLParagraphElement;
      tagElement.classList.add("badge", "bg-light", "text-dark");
      tagElement.textContent = tag;

      const delBtn = document.createElement("button") as HTMLButtonElement;
      delBtn.classList.add("btn", "btn-close");
      delBtn.setAttribute("aria-label", "Tag entfernen");

      tagElement.appendChild(delBtn);

      colDiv.appendChild(tagElement);

      modalTags.appendChild(colDiv);
    })
  }

  // Setze den Wert des Input-Feldes zurück, wenn das Modal geöffnet wird
  const modalEditTitle : HTMLInputElement = document.querySelector('#edit-name') as HTMLInputElement;
  modalEditTitle.value = "";

  // Setze den Wert des Input-Feldes zurück, wenn das Modal geöffnet wird
  const addTagInput  = document.querySelector("#addTagInput") as HTMLInputElement;
  addTagInput.value = "";
});

/**
 * Wenn die Seite geladen wird:
 * GET /username
 * GET /photos
 */
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

  dataGetPhotos.photos.forEach(photo  => insertPhotos(photo.title, photo.taken, `http://localhost:8080/img/${photo.url}`, photo.tags == null ? "" : photo.tags));
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
function insertPhotos(title : string, taken : string, url : string, tags:string) : void {
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



const addAlbumSubmit = document.getElementById("addAlbumSubmit") as HTMLButtonElement;
addAlbumSubmit.addEventListener("click", async (evt: MouseEvent)=> {
  const albumName = (document.getElementById("addAlbumName")as HTMLInputElement).value;
  const reqData = {
    album : {
      title : albumName

    }
  };

  const res : Response = await fetch(serverAdress + "/albums", {
    method: "POST",
    credentials : "include",
    headers : {
      "Content-Type" : "application/json"
    },
    body : JSON.stringify(reqData),
  });
  const data = await res.json();


});

const addPhotoDate = document.getElementById("addPhotoDate") as HTMLInputElement;
let today = new Date().toISOString().split("T")[0];
addPhotoDate.setAttribute("max", today)

  const addPhotoSubmit = document.getElementById("addPhotoSubmit") as HTMLButtonElement;
addPhotoSubmit.addEventListener("click", async (evt: MouseEvent)=> {
  const photoName = (document.getElementById("addPhotoName")as HTMLInputElement).value;
  const photoDate = (document.getElementById("addPhotoDate") as HTMLInputElement).value;
  const photoData =((document.getElementById("photoUploadBtn") as HTMLInputElement).files as FileList);
  const formData = new FormData();

  formData.append("title", photoName);
  formData.append("taken", photoDate);
  formData.append("photo", photoData[0]);


  const res : Response = await fetch(serverAdress + "/photos", {
    method: "POST",
    credentials : "include",
    headers : {
      "Content-Type" : "multipart/form-data"
    },
    body : formData
  });
  const data = await res.json();


});
