interface Photo {
  id : string,
  title: string;
  taken: string;
  imgUrl: string;
  tags?:string; // tags als kommaseparierter String
}

/**
 * POST /logout
 */
function logout() {
  const logoutBtn = document.querySelector("#logout-btn") as HTMLButtonElement;
  logoutBtn.addEventListener("click", async () => {
    try {
      const res : Response = await fetch("http://localhost:8080/logout", {
        method : "POST",
        redirect : "follow",
        credentials : "include"
      });

      if (res.redirected) {
        window.location.href = res.url; // https://stackoverflow.com/questions/39735496/redirect-after-a-fetch-post-call
      } else {
        const data : { message : string } = await res.json();
        console.log(data.message);
      }

    } catch(error) {
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
 * Behandelt das Klick-Ereignis auf ein Galerie-Element.
 * @param e MouseEvent
 */
function handleGalleryItemClick(e : MouseEvent) {
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
function extractPhotoData(target: HTMLElement) : Photo {
  const title = target.getAttribute('title') as string;
  const id = target.getAttribute('data-id') as string;
  const imgUrl = target.getAttribute('src') as string;
  const taken = target.getAttribute('data-date') as string;
  const tags = target.getAttribute('data-tags') as string;
  return { id, title, taken, imgUrl, tags };
}

/**
 * Aktualisiert das Modal mit den extrahierten Fotodaten
 * @param photoData Ein Photo Objekt, welches die Fotodaten beinhaltet
 */
function updateModalUI(photoData: Photo) {
  const { id, title, taken, imgUrl, tags } = photoData; // DESTRUCTURING

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
}

/**
 * Aktualisiert die Modal-Tags-UI.
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

      delBtn.addEventListener("click", async() => await handleTagDelete(delBtn, tag, colDiv));

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
 * Fügt einen Event-Listener zum Hinzufügen eines Tags hinzu
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
 * POST /tag
 * {
 *     photoID: ___,
 *     tag: ___
 * }
 *
 * @param photoID Die id des Fotos (unique, weil primary key)
 * @param tagName Der Tag, der hinzugefügt werden soll
 */
async function handleTagAdd(photoID: number, tagName: string) {
  interface ServerReq {
    photoID : number,
    tag : string
  }


  // console.log("called2");
  const reqData : ServerReq = {
    photoID: photoID,
    tag: tagName
  };
  try {
    const res: Response = await fetch("http://localhost:8080/photos/tag", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(reqData)
    });

    if (res.status == 201) {

      const data : { message : string } = await res.json();
      console.log(data.message);

      (document.querySelector("#error-edit-photo-container")  as HTMLDivElement).classList.add("d-none");
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
      const data : { message : string }  = await res.json();
      renderError(document.querySelector("#error-edit-photo-container") as HTMLDivElement, false, data.message);
    }
  } catch(error) {
    console.error("Error POST /tag", error);
  }

}



/**
 * Rendert die Fehlermeldungen, die auftreten können, wenn man ein Foto bearbeitet.
 * @param resetErrorMessage true, wenn die Fehlermeldung zurückgesetzt werden soll und der container versteckt werden soll; false sonst
 * @param message Die Fehlermeldung, die gerendert werden soll
 */
function renderError(errorContainer : HTMLElement, resetErrorMessage: boolean, message?: string) {
  // const errorContainer = document.querySelector("#error-edit-photo-container") as HTMLDivElement;

  const errorParagraph = errorContainer.querySelector("p") as HTMLParagraphElement;

  if (resetErrorMessage) {
    // Wenn resetErrorMessage true ist, leeren wir die Fehlermeldung und verstecken den Container
    if (errorParagraph) {
      errorParagraph.textContent = '';
    }
    if (errorContainer) {
      errorContainer.classList.add("d-none");
    }
  } else {
    // Wenn message definiert ist und nicht leer ist, zeigen wir die Fehlermeldung an
    if (message && message.trim() != '') {
      if (errorParagraph) {
        errorParagraph.textContent = message;
      }
      if (errorContainer) {
        errorContainer.classList.remove("d-none");
      }
    } else {
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
 * @param delBtn HTMLButtonElement
 * @param tag string
 * @param colDiv HTMLDivElement
 */
async function handleTagDelete(delBtn: HTMLButtonElement, tag: string, colDiv: HTMLDivElement) {
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

    if (res.status == 204) {
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
      console.log(await res.json())
    }
  } catch(error) {
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
    (document.querySelector("#submit-edit-name") as HTMLButtonElement).addEventListener("click", async() => {
      try {
        interface ServerReq {
          photoID : number,
          photoTitle : string
        }

        const photoID = Number((document.querySelector("#modal-img") as HTMLImageElement).getAttribute("data-id"));
        const reqData : ServerReq = {
          photoID : photoID,
          photoTitle : (document.querySelector("#edit-name") as HTMLInputElement).value
        }

        const res = await fetch("http://localhost:8080/photos/photoTitle", {
          method : "PATCH",
          credentials : "include",
          body : JSON.stringify(reqData)
        })

        const data = await res.json();

        if (res.status == 200) {
          const img = document.querySelector(`img[data-id='${photoID}']`) as HTMLImageElement;
          img.setAttribute("title", data.photoTitle);
          renderError(document.querySelector("#error-edit-photo-container") as HTMLDivElement, true);
          updateModalUI(extractPhotoData(img));
        } else {
          console.log("called");
          renderError(document.querySelector("#error-edit-photo-container") as HTMLDivElement, false, data.message);
        }
      } catch(error) {
        console.log("Error updating photo's title" + error);
      }
    })
  })
}
editPhotoTitle();


/**
 * GET /username
 */
async function fetchUsername() : Promise<void> {
  try {
    const res : Response = await fetch("/username", {
      method : "GET",
      credentials : "include"
    });

    if (!res.ok) {
      console.error("Error fetching username");
    }

    const data : { username : string, role : string } = await res.json();
    console.log(data);

    renderUsername(data.username);

  } catch (error) {
    console.error("Error GET /username", error);
  }
}

/**
 * GET /role
 */
async function fetchRole()  {
  try {
    const res : Response = await fetch("http://localhost:8080/role", {
      method : "GET",
      credentials : "include"
    })
    const data : { role : string } = await res.json()
    renderGoToAdminPage(data.role);
  } catch (error) {
    console.error("Error GET /role" + error);
  }
}

/**
 * Zeigt den Button "Zur Adminseite" nicht an, wenn der Nutzer kein Admin ist.
 * @param role Rolle des Benutzers
 */
function renderGoToAdminPage(role : string) : void {
  const goToAdminPageItem = document.querySelector("#go-to-admin-page") as HTMLButtonElement;
  if (role == "ADMIN") {
    goToAdminPageItem.classList.remove("d-none");
  } else {
    goToAdminPageItem.classList.add("d-none");
  }
}


function redirectToAdminPage() {
  (document.querySelector("#go-to-admin-page") as HTMLButtonElement).addEventListener("click", async() => {
    try {
      const res = await fetch("http://localhost:8080/protected/admin.html");

      window.location.href = res.url;

    } catch(error) {
      console.error("Error redirecting to Admin-Page")
    }
  })
}
redirectToAdminPage();

/**
 * Funktion zum Rendern des Benutzernamens im DOM
 * @param username Der Benutzername
 */
function renderUsername(username : string) {
  const usernameField = document.querySelector("#username") as HTMLParagraphElement;
  usernameField.textContent = username;
}

function addSearchPhotosListener() {
  (document.querySelector("#searchPhotos") as HTMLFormElement).addEventListener("submit", async(evt : SubmitEvent) => {
    evt.preventDefault()
    const query = (document.querySelector("#searchPhotosQuery") as HTMLInputElement).value;
    await fetchPhotos(query);
  })
}
addSearchPhotosListener();


/**
 * GET /photos <br>
 * Funktion zum Abrufen aller Fotos eines Benutzers vom Server
 */
async function fetchPhotos(searchVal? : string) : Promise<void> {
  try {
    console.log(searchVal);
    const res : Response = await fetch("/photos?" +(searchVal ? new URLSearchParams({photoTitle : searchVal, tag : searchVal}).toString() : ""), {
      method : "GET",
      credentials : "include"
    });

    if (!res.ok) {
      console.error("Error fetching photos");
    }

    const data : { photos : Photo[] } = await res.json();

    clearImages(document.querySelector("#main-photos-container .row") as HTMLDivElement);
    data.photos.forEach(photo  => renderPhotos(photo));

  } catch (error) {
    console.error("Error GET /photos", error);
  }
}

/**
 * Funktion zum Initialisieren der Seite.
 */
function initializePage() : void {
  document.addEventListener("DOMContentLoaded", async () : Promise<void> => {
    await fetchUsername();
    await fetchPhotos();
    await fetchRole();
  });
}
initializePage();

/**
 * Entfernt die Bilder aus dem DOM
 * @param element Das entsprechende Element
 */
function clearImages(element : HTMLElement) {

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
function renderPhotos(photo : Photo) : void {
  const {id, imgUrl, title, taken, tags }  = photo;

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
 * PATCH /photos/photoDate
 * {
 *     "photoID" : ___,
 *     "date" : ___
 * }
 */
async function handleEditPhotoDate(date : string) {
  const photoID = (document.querySelector("#modal-img") as HTMLImageElement).dataset.id as string;
  try {
    const reqData = {
      photoID : photoID,
      date : date
    }

    const res = await fetch("http://localhost:8080/photos/photoDate", {
      method : "PATCH",
      credentials : "include",
      body : JSON.stringify(reqData)
    })

    const data   : { message : string, newDate ?: string } = await res.json();

    if (res.status == 200) {
      const imgElement = document.querySelector(`img[data-id='${photoID}']`) as HTMLImageElement;
      imgElement.dataset.date = data.newDate;
      updateModalUI(extractPhotoData(imgElement));
      renderError(document.querySelector("#error-edit-photo-container") as HTMLDivElement, true);
    } else {
      renderError(document.querySelector("#error-edit-photo-container") as HTMLDivElement,false, data.message);
    }
  } catch (error) {
    console.error("Error PATCH /photoDate")
  }
}

function editDateListener() {
  document.addEventListener("DOMContentLoaded", () => {
    (document.querySelector("#submit-edit-date") as HTMLButtonElement).addEventListener("click", async() => {
      await handleEditPhotoDate((document.querySelector("#edit-date") as HTMLInputElement).value);
    })
  })
}
editDateListener();


function editDelPhotoBtnListener() {
  (document.querySelector("#del-photo-btn") as HTMLButtonElement).addEventListener("click", async () => {
    await handlePhotoDelete((document.querySelector("#modal-img") as HTMLImageElement).dataset.id as string);
  })
}
editDelPhotoBtnListener();

async function handlePhotoDelete(photoID : string) {
  const res = await fetch(`http://localhost:8080/img/${photoID}`, {
    method : "DELETE",
    credentials : "include"
  })

  if (res.status == 204) {
    renderError(document.querySelector("#error-edit-photo-container") as HTMLDivElement, true);
    await fetchPhotos()
    window.location.reload();
  } else {
    const data : { message : string } = await res.json();
    console.log(data.message);
    renderError(document.querySelector("#error-edit-photo-container") as HTMLDivElement, false, data.message);
  }
}




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

  try {
    const res: Response = await fetch("http://localhost:8080/photos", {
      method: "POST",
      credentials: "include",
      headers: {},
      body: formData
    });
    const data : { message : string } = await res.json();

    if (res.status == 201) {
      window.location.reload();
      renderError(document.querySelector("#error-add-photo-container") as HTMLDivElement, true );
    } else {
      renderError(document.querySelector("#error-add-photo-container") as HTMLDivElement, false, data.message);
    }
  }
  catch (error){
    console.log("ERROR at POST /photos");
  }
});

// --- ALBEN ---

interface Album {
  id : number,
  title : string,
  tags ?: string
}

function fetchAlbums() {
  try {

  } catch (error) {
    console.error(error);
  }
}



function renderAlbums(albums : Album[]) {
  const displayAlbumsContainer = document.querySelector("#display-albums") as  HTMLUListElement;
  albums.forEach(album => {
    const {id, title, tags } = album;
    const albumChild = document.createElement("li") as HTMLElement;
    albumChild.setAttribute("data-album-id", id.toString()); // Insert album id in parent container
    if (typeof tags == "string") {
      albumChild.setAttribute("data-tags", tags);
    }
    albumChild.className = "list-group-item d-flex align-items-center";
    albumChild.innerHTML = `
      <button class="btn w-75 d-flex justify-content-start">${title}</button> <!-- Albumtitel hier einfügen -->
        <span>
            <!-- Edit Button - OPENS EDIT MODAL ALBUM -->
            <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#editAlbumModal">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
              </svg>
            </button>
            <!-- Delete Button - Deletes album -->
            <button class="btn btn-sm btn-outline-danger">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
              </svg>
            </button>
         </span>
      <button>
    `
    displayAlbumsContainer.appendChild(albumChild);
  })
}