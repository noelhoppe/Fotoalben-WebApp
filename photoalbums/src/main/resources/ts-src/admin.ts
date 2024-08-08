// @ts-ignore
import {renderError, togglePasswordVisibility} from "/helper.js";
togglePasswordVisibility();

interface User {
    id : number
    username : string,
    password : string,
    role : string
}


async function initializeUserPage() {
    await fetchUsers();
    addUserDeleteListener();
    giveUserIDToModal();
}
initializeUserPage();

/**
 * Wartet auf das Submit-Event des Formulars nach einem Nutzer zu suchen und extrahiert, wenn dieses Event ausgelöst wird den eingegebenen Wert aus dem Input-Feld<br>
 * Ruft mit dem extrahiertem Wert {@link fetchUsers} auf.
 *
 */
function searchUser() {
    const queryUsernameForm = document.querySelector("#queryUsername") as HTMLFormElement;
    queryUsernameForm.addEventListener("submit", async(evt : SubmitEvent) => {
        evt.preventDefault();
        const usernameInput = (document.querySelector("#queryUsernameInput") as HTMLInputElement).value;
        await fetchUsers(usernameInput)
    })
}
searchUser();

/**
 * Setzt die User Tabelle zurück
 */
function resetUserTable() {
    (document.querySelector("#tbody-display-users") as HTMLTableSectionElement).innerHTML = "";
}

/**
 * Ruft GET /users mit optionalen Suchparametern auf<br>
 * Setzt die User-Tabelle zurück {@link resetUserTable} und rendert diese neu {@link renderSingleUserRow} <br>
 * @param searchParam Optionaler Suchparameter, der in der http-Anfrage berücksichtigt wird.
 */
async function fetchUsers(searchParam ?: string) {
    try {
        const res = await fetch("http://localhost:8080/users?" + (searchParam ? new URLSearchParams({username :  searchParam}) : ""));


        if (res.ok) {
            const data : { users : User[] } = await res.json();
            const users = data.users;
            resetUserTable();
            users.forEach(user => renderSingleUserRow(user))
        } else {
            const data : { message : string } = await res.json();
            console.log(`Status ${res.status}. Message ${data.message}`);
        }
    } catch(error) {
        console.error("Error GET /users", error);
    }
}

/**
 * Rendert eine Zeile in der User-Tabelle
 * @param user Der entsprechende Benutzer, der in der Tabelle gerendert wird.
 */
function renderSingleUserRow(user : User) {
    const tbodyContainer = document.querySelector("#tbody-display-users") as HTMLTableSectionElement;

    const {id, username, role} = user; // DESTRUCTURING
    const newRow = tbodyContainer.insertRow();
    newRow.setAttribute("data-users-id", id.toString());

    newRow.insertCell().textContent = username;
    newRow.insertCell().textContent = role;

    const actionCell = newRow.insertCell();
    actionCell.innerHTML = `
          <div class="row gy-3">
            <div class="col d-flex align-items-center">
              <button class="btn btn-warning w-100 edit-user-btn" data-bs-toggle="modal" data-bs-target="#editModal">Bearbeiten</button> <!-- KONVENTION: Jeder "Benutzer löschen" Button hat die Klass .edit-user-btn -->
            </div>
            <div class="col d-flex align-items-center">
              <button class="btn btn-danger w-100 del-user-btn"> <!-- KONVENTION: Jeder "Benutzer löschen" Button hat die Klass .del-user-btn -->
                Benutzer löschen
              </button>
            </div>
          </div>
    `;
}
// renderSingleUserRow({id : 1, username : "Noel", password : "0610", role : "ADMIN"});

/**
 * Setzt einen Klick-Event-Listener auf alle Buttons mit der Klasse .del-user.btn und extrahier bei Klick die userID des entsprechenden Benutzers.<br>
 * Mit dieser ID wird {@link fetchUserDelete} aufgerufen
 */
function addUserDeleteListener() {
    const deleteButtons = document.querySelectorAll(".del-user-btn") as NodeListOf<HTMLButtonElement>
    deleteButtons.forEach((delBtn : HTMLButtonElement)  => {
        delBtn.addEventListener("click", async () => {
            const trElement = delBtn.closest("tr") as HTMLTableRowElement;
            const userID = trElement.getAttribute("data-users-id") as string;
            await fetchUserDelete(parseInt(userID));
        })
    })
}

/**
 * DELETE /users/:userID
 * @param userID Die ID des entsprechenden Benutzers
 */
async function fetchUserDelete(userID : number) {
    try {
        const res = await fetch("http://localhost:8080/users/" + userID, {
            method : "DELETE",
            credentials : "include"
        });

        console.log(res.status)

        if (res.status == 204) {
            await fetchUsers();
        } else {
            const data : { message : string } = await res.json();
            console.log(data.message)
        }
    } catch(error) {
        console.error(error);
    }
}

/**
 * Setze die Modal-Inputs, um einen Nutzer zu Erstellen, zurück
 */
function resetAddModalInputs() {
    (document.querySelector("#field-username") as HTMLInputElement).value = "";
    (document.querySelector("#field-password") as HTMLInputElement).value = "";
}
(document.querySelector("#open-modal") as HTMLButtonElement).addEventListener("click", () => resetAddModalInputs());

/**
 * Extrahiert die Felder username und password aus den input Feldern, wenn der Button gedrückt wird<br>
 * Ruft mit den extrahierten Daten POST /users auf<br>
 * Lädt die Seite bei Erfolg neu und setzt die Fehlermeldung zurück {@link renderError} und {@link renderError} bei Misserfolg
 */
function addUser() {
  const addUserBtn = (document.getElementById("addUserBtn") as HTMLButtonElement);
  addUserBtn.addEventListener("click", async (MouseEvent) => {
    const username = (document.getElementById("field-username") as HTMLInputElement).value;
    const passwd = (document.getElementById("field-password") as HTMLInputElement).value;
    const reqData = {
        username : username,
        password : passwd
    };

    try {
      const res : Response = await fetch( "http://localhost:8080/users", {
        method: "POST",
        credentials : "include",
        headers : {
          "Content-Type" : "application/json"
        },
        body : JSON.stringify(reqData),
      });

      const errorContainer = document.querySelector("#error-add-user-container") as HTMLDivElement;
      if (res.status == 201) {
          renderError(errorContainer, true);
          window.location.reload();
      } else {
          const data : { message : string } = await res.json();
          renderError(errorContainer, false, data.message);
      }

    } catch(error){
      console.log("ERROR at POST /users")
    }
  });


}
addUser();


/**
 * Extrahiert die Attribute des Nutzer aus der Tabelle und übertragt sie ins Modal.
 */
function giveUserIDToModal() {
    const editBtns = document.querySelectorAll(".edit-user-btn") as NodeListOf<HTMLButtonElement>;
    editBtns.forEach(editBtn => {
        editBtn.addEventListener("click", () => {
            const tr = editBtn.closest("tr") as HTMLTableRowElement;
            const username = (tr.firstChild as HTMLDataElement).textContent as string;
            const userID = tr.getAttribute("data-users-id") as string
            const editUsersModalContainer = document.querySelector("#editModal") as HTMLDivElement;
            editUsersModalContainer.setAttribute("data-user-id", userID);
            (document.querySelector("#editModalLabel") as HTMLHeadingElement).textContent = `${username} bearbeiten`;
            editUsername();
            editPassword();
        })
    })
}


/**
 * Wartet auf das Submit-Event des entsprechenden Formulars und ruft mit den extrahierten Werten {@link fetchEditUsername} auf
 */
function editUsername() {
    (document.querySelector("#username-form") as HTMLFormElement).addEventListener("submit", (evt : SubmitEvent)  => {
        evt.preventDefault();
        const newUsername = (document.querySelector("#username") as HTMLInputElement).value;
        const editUserModalContainer = document.querySelector("#editModal") as HTMLDivElement;
        const userID = editUserModalContainer.getAttribute("data-user-id") as string;
        fetchEditUsername(parseInt(userID), newUsername);
    })
}

/**
 * Wartet auf das Submit-Event des entsprechenden Formulars und ruft mit den extrahierten Werten {@link fetchEditPassword} auf
 */
function editPassword() {
    (document.querySelector("#password-form") as HTMLFormElement).addEventListener("submit", async(evt : SubmitEvent) => {
        evt.preventDefault();
        const newPassword = (document.querySelector("#password") as HTMLInputElement).value;
        const editUserModalContainer = document.querySelector("#editModal") as HTMLDivElement;
        const userID = editUserModalContainer.getAttribute("data-user-id") as string;
        await fetchEditPassword(parseInt(userID), newPassword);
    })
}

/**
 * PATCH /users/password/:userID
 * @param userID Die ID des Benutzers
 * @param password Das neue Password des Benutzers
 */
async function fetchEditPassword(userID : number, password : string) {
    try {
        const res = await fetch("http://localhost:8080/users/password/" + userID, {
            method : "PATCH",
            credentials : "include",
            body : JSON.stringify({password : password })
        })

        const errorContainer = document.querySelector("#error-edit-user-container") as HTMLDivElement;
        if (res.ok) {
            renderError(errorContainer, true);
            window.location.reload();
        } else {
            const data : { message : string } = await res.json();
            renderError(errorContainer, false, data.message);
        }

    } catch(err) {
        console.error(err);
    }
}

/**
 * PATCH /users/username/:userID
 * @param userID Die ID des Benutzers
 * @param username Der neue Benutzername des Benutzers
 */
async function fetchEditUsername(userID : number, username : string) {
    try {
        const res = await fetch("http://localhost:8080/users/username/" + userID, {
            method : "PATCH",
            credentials : "include",
            body : JSON.stringify({username : username})
        })

        const errorContainer = document.querySelector("#error-edit-user-container") as HTMLDivElement;
        if (res.ok) {
            renderError(errorContainer, true);
            window.location.reload();
        } else {
            const data : { message : string } = await res.json();
            renderError(errorContainer, false, data.message);
        }



    } catch(err) {
        console.error(err);
    }
}


/**
 * Ruft, wenn der entsprechende Button geklickt wird /protected/photoalbums.html auf
 */
function redirectToPhotoalbumsPage() {
    (document.querySelector("#redirect-to-photoalbums") as HTMLButtonElement).addEventListener("click", async() => {
        try {
            const res = await fetch("http://localhost:8080/protected/photoalbums.html")

            if (res.ok) {
                window.location.href = res.url;
            } else {
                throw new Error(`HTTP Error! Status: ${res.status}`)
            }

        } catch(error) {
            console.error("Error redirecting to /protected/photoalbums.html.", error);
        }
    });
}
redirectToPhotoalbumsPage();
