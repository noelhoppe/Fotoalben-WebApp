var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// @ts-ignore
import { renderError, togglePasswordVisibility } from "/helper.js";
togglePasswordVisibility();
function initializeUserPage() {
    return __awaiter(this, void 0, void 0, function* () {
        yield fetchUsers();
        addUserDeleteListener();
        giveUserIDToModal();
    });
}
initializeUserPage();
/**
 * Wartet auf das Submit-Event des Formulars nach einem Nutzer zu suchen und extrahiert, wenn dieses Event ausgelöst wird den eingegebenen Wert aus dem Input-Feld<br>
 * Ruft mit dem extrahiertem Wert {@link fetchUsers} auf.
 *
 */
function searchUser() {
    const queryUsernameForm = document.querySelector("#queryUsername");
    queryUsernameForm.addEventListener("submit", (evt) => __awaiter(this, void 0, void 0, function* () {
        evt.preventDefault();
        const usernameInput = document.querySelector("#queryUsernameInput").value;
        yield fetchUsers(usernameInput);
    }));
}
searchUser();
/**
 * Setzt die User Tabelle zurück
 */
function resetUserTable() {
    document.querySelector("#tbody-display-users").innerHTML = "";
}
/**
 * Ruft GET /users mit optionalen Suchparametern auf<br>
 * Setzt die User-Tabelle zurück {@link resetUserTable} und rendert diese neu {@link renderSingleUserRow} <br>
 * @param searchParam Optionaler Suchparameter, der in der http-Anfrage berücksichtigt wird.
 */
function fetchUsers(searchParam) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("http://localhost:8080/users?" + (searchParam ? new URLSearchParams({ username: searchParam }) : ""));
            if (res.ok) {
                const data = yield res.json();
                const users = data.users;
                resetUserTable();
                users.forEach(user => renderSingleUserRow(user));
            }
            else {
                const data = yield res.json();
                console.log(`Status ${res.status}. Message ${data.message}`);
            }
        }
        catch (error) {
            console.error("Error GET /users", error);
        }
    });
}
/**
 * Rendert eine Zeile in der User-Tabelle
 * @param user Der entsprechende Benutzer, der in der Tabelle gerendert wird.
 */
function renderSingleUserRow(user) {
    const tbodyContainer = document.querySelector("#tbody-display-users");
    const { id, username, role } = user; // DESTRUCTURING
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
    const deleteButtons = document.querySelectorAll(".del-user-btn");
    deleteButtons.forEach((delBtn) => {
        delBtn.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
            const trElement = delBtn.closest("tr");
            const userID = trElement.getAttribute("data-users-id");
            yield fetchUserDelete(parseInt(userID));
        }));
    });
}
/**
 * DELETE /users/:userID
 * @param userID Die ID des entsprechenden Benutzers
 */
function fetchUserDelete(userID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("http://localhost:8080/users/" + userID, {
                method: "DELETE",
                credentials: "include"
            });
            console.log(res.status);
            if (res.status == 204) {
                yield fetchUsers();
            }
            else {
                const data = yield res.json();
                console.log(data.message);
            }
        }
        catch (error) {
            console.error(error);
        }
    });
}
/**
 * Setze die Modal-Inputs, um einen Nutzer zu Erstellen, zurück
 */
function resetAddModalInputs() {
    document.querySelector("#field-username").value = "";
    document.querySelector("#field-password").value = "";
}
document.querySelector("#open-modal").addEventListener("click", () => resetAddModalInputs());
/**
 * Extrahiert die Felder username und password aus den input Feldern, wenn der Button gedrückt wird<br>
 * Ruft mit den extrahierten Daten POST /users auf<br>
 * Lädt die Seite bei Erfolg neu und setzt die Fehlermeldung zurück {@link renderError} und {@link renderError} bei Misserfolg
 */
function addUser() {
    const addUserBtn = document.getElementById("addUserBtn");
    addUserBtn.addEventListener("click", (MouseEvent) => __awaiter(this, void 0, void 0, function* () {
        const username = document.getElementById("field-username").value;
        const passwd = document.getElementById("field-password").value;
        const reqData = {
            username: username,
            password: passwd
        };
        try {
            const res = yield fetch("http://localhost:8080/users", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reqData),
            });
            const errorContainer = document.querySelector("#error-add-user-container");
            if (res.status == 201) {
                renderError(errorContainer, true);
                window.location.reload();
            }
            else {
                const data = yield res.json();
                renderError(errorContainer, false, data.message);
            }
        }
        catch (error) {
            console.log("ERROR at POST /users");
        }
    }));
}
addUser();
/**
 * Extrahiert die Attribute des Nutzer aus der Tabelle und übertragt sie ins Modal.
 */
function giveUserIDToModal() {
    const editBtns = document.querySelectorAll(".edit-user-btn");
    editBtns.forEach(editBtn => {
        editBtn.addEventListener("click", () => {
            const tr = editBtn.closest("tr");
            const username = tr.firstChild.textContent;
            const userID = tr.getAttribute("data-users-id");
            const editUsersModalContainer = document.querySelector("#editModal");
            editUsersModalContainer.setAttribute("data-user-id", userID);
            document.querySelector("#editModalLabel").textContent = `${username} bearbeiten`;
            editUsername();
            editPassword();
        });
    });
}
/**
 * Wartet auf das Submit-Event des entsprechenden Formulars und ruft mit den extrahierten Werten {@link fetchEditUsername} auf
 */
function editUsername() {
    document.querySelector("#username-form").addEventListener("submit", (evt) => {
        evt.preventDefault();
        const newUsername = document.querySelector("#username").value;
        const editUserModalContainer = document.querySelector("#editModal");
        const userID = editUserModalContainer.getAttribute("data-user-id");
        fetchEditUsername(parseInt(userID), newUsername);
    });
}
/**
 * Wartet auf das Submit-Event des entsprechenden Formulars und ruft mit den extrahierten Werten {@link fetchEditPassword} auf
 */
function editPassword() {
    document.querySelector("#password-form").addEventListener("submit", (evt) => __awaiter(this, void 0, void 0, function* () {
        evt.preventDefault();
        const newPassword = document.querySelector("#password").value;
        const editUserModalContainer = document.querySelector("#editModal");
        const userID = editUserModalContainer.getAttribute("data-user-id");
        yield fetchEditPassword(parseInt(userID), newPassword);
    }));
}
/**
 * PATCH /users/password/:userID
 * @param userID Die ID des Benutzers
 * @param password Das neue Password des Benutzers
 */
function fetchEditPassword(userID, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("http://localhost:8080/users/password/" + userID, {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify({ password: password })
            });
            const errorContainer = document.querySelector("#error-edit-user-container");
            if (res.ok) {
                renderError(errorContainer, true);
                window.location.reload();
            }
            else {
                const data = yield res.json();
                renderError(errorContainer, false, data.message);
            }
        }
        catch (err) {
            console.error(err);
        }
    });
}
/**
 * PATCH /users/username/:userID
 * @param userID Die ID des Benutzers
 * @param username Der neue Benutzername des Benutzers
 */
function fetchEditUsername(userID, username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("http://localhost:8080/users/username/" + userID, {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify({ username: username })
            });
            const errorContainer = document.querySelector("#error-edit-user-container");
            if (res.ok) {
                renderError(errorContainer, true);
                window.location.reload();
            }
            else {
                const data = yield res.json();
                renderError(errorContainer, false, data.message);
            }
        }
        catch (err) {
            console.error(err);
        }
    });
}
/**
 * Ruft, wenn der entsprechende Button geklickt wird /protected/photoalbums.html auf
 */
function redirectToPhotoalbumsPage() {
    document.querySelector("#redirect-to-photoalbums").addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("http://localhost:8080/protected/photoalbums.html");
            if (res.ok) {
                window.location.href = res.url;
            }
            else {
                throw new Error(`HTTP Error! Status: ${res.status}`);
            }
        }
        catch (error) {
            console.error("Error redirecting to /protected/photoalbums.html.", error);
        }
    }));
}
redirectToPhotoalbumsPage();
