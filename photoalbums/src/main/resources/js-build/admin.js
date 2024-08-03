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
function initializePage() {
    return __awaiter(this, void 0, void 0, function* () {
        yield fetchUsers();
        addUserDeleteListener();
        giveUserIDToModal();
    });
}
initializePage();
function searchUser() {
    const queryUsernameForm = document.querySelector("#queryUsername");
    queryUsernameForm.addEventListener("submit", (evt) => __awaiter(this, void 0, void 0, function* () {
        evt.preventDefault();
        const usernameInput = document.querySelector("#queryUsernameInput").value;
        yield fetchUsers(usernameInput);
    }));
}
searchUser();
function resetUserTable() {
    document.querySelector("#tbody-display-users").innerHTML = "";
}
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
              <button class="btn btn-warning w-100 edit-user-btn" data-bs-toggle="modal" data-bs-target="#editModal">Bearbeiten</button>
            </div>
            <div class="col d-flex align-items-center">
              <button class="btn btn-danger w-100 del-user-btn">
                Benutzer löschen
              </button>
            </div>
          </div>
    `;
}
// renderSingleUserRow({id : 1, username : "Noel", password : "0610", role : "ADMIN"});
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
function addUser() {
    const addUserBtn = document.getElementById("addUserBtn");
    addUserBtn.addEventListener("click", (MouseEvent) => __awaiter(this, void 0, void 0, function* () {
        const username = document.getElementById("field-username").value;
        const passwd = document.getElementById("field-password").value;
        const reqData = {
            user: {
                name: username,
                password: passwd
            }
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
        }
        catch (error) {
            console.log("ERROR at POST /users");
        }
    }));
}
addUser();
function giveUserIDToModal() {
    const editBtns = document.querySelectorAll(".edit-user-btn");
    editBtns.forEach(editBtn => {
        editBtn.addEventListener("click", () => {
            const tr = editBtn.closest("tr");
            const userID = tr.getAttribute("data-users-id");
            const editUsersModalContainer = document.querySelector("#editModal");
            editUsersModalContainer.setAttribute("data-user-id", userID);
            editUsername();
            editPassword();
        });
    });
}
function editUsername() {
    document.querySelector("#username-form").addEventListener("submit", (evt) => {
        evt.preventDefault();
        const newUsername = document.querySelector("#username").value;
        const editUserModalContainer = document.querySelector("#editModal");
        const userID = editUserModalContainer.getAttribute("data-user-id");
        fetchEditUsername(parseInt(userID), newUsername);
    });
}
function editPassword() {
    document.querySelector("#password-form").addEventListener("submit", (evt) => {
        evt.preventDefault();
        const newPassword = document.querySelector("#password").value;
        const editUserModalContainer = document.querySelector("#editModal");
        const userID = editUserModalContainer.getAttribute("data-user-id");
        fetchEditPassword(parseInt(userID), newPassword);
    });
}
function fetchEditPassword(userID, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("http://localhost:8080/users/password/" + userID, {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify({ password: password })
            });
            const data = yield res.json();
            if (res.ok) {
                window.location.reload();
            }
            console.log(res.status);
            console.log(data.message);
        }
        catch (err) {
            console.error(err);
        }
    });
}
function fetchEditUsername(userID, username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("http://localhost:8080/users/username/" + userID, {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify({ username: username })
            });
            const data = yield res.json();
            if (res.ok) {
                window.location.reload();
            }
            console.log(res.status);
            console.log(data.message);
        }
        catch (err) {
            console.error(err);
        }
    });
}
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
