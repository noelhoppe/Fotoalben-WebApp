// TODO: Use of modules ES/CJS, um togglePasswordVisibility zu nutzen
interface User {
    id : number
    username : string,
    password : string,
    role : string
}


async function initializePage() { // FIXME: TS2393: Duplicate function implementation?
    await fetchUsers();
    addUserDeleteListener();
    giveUserIDToModal();
}
initializePage();

function searchUser() {
    const queryUsernameForm = document.querySelector("#queryUsername") as HTMLFormElement;
    queryUsernameForm.addEventListener("submit", async(evt : SubmitEvent) => {
        evt.preventDefault();
        const usernameInput = (document.querySelector("#queryUsernameInput") as HTMLInputElement).value;
        await fetchUsers(usernameInput)
    })
}
searchUser();

function resetUserTable() {
    (document.querySelector("#tbody-display-users") as HTMLTableSectionElement).innerHTML = "";
}

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
    const deleteButtons = document.querySelectorAll(".del-user-btn") as NodeListOf<HTMLButtonElement>
    deleteButtons.forEach((delBtn : HTMLButtonElement)  => {
        delBtn.addEventListener("click", async () => {
            const trElement = delBtn.closest("tr") as HTMLTableRowElement;
            const userID = trElement.getAttribute("data-users-id") as string;
            await fetchUserDelete(parseInt(userID));
        })
    })
}


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

function resetModalInputs(modal : HTMLElement) {
    (document.querySelector("#field-username") as HTMLInputElement).value = "";
    (document.querySelector("#field-password") as HTMLInputElement).value = "";
}
(document.querySelector("#open-modal") as HTMLButtonElement).addEventListener("click", resetModalInputs);

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
      if (res.status == 201) window.location.reload();
    } catch(error){
      console.log("ERROR at POST /users")
    }
  });


}
addUser();



function giveUserIDToModal() {
    const editBtns = document.querySelectorAll(".edit-user-btn") as NodeListOf<HTMLButtonElement>;
    editBtns.forEach(editBtn => {
        editBtn.addEventListener("click", () => {
            const tr = editBtn.closest("tr") as HTMLTableRowElement;
            const userID = tr.getAttribute("data-users-id") as string
            const editUsersModalContainer = document.querySelector("#editModal") as HTMLDivElement;
            editUsersModalContainer.setAttribute("data-user-id", userID);
            editUsername();
            editPassword();
        })
    })
}



function editUsername() {
    (document.querySelector("#username-form") as HTMLFormElement).addEventListener("submit", (evt : SubmitEvent)  => {
        evt.preventDefault();
        const newUsername = (document.querySelector("#username") as HTMLInputElement).value;
        const editUserModalContainer = document.querySelector("#editModal") as HTMLDivElement;
        const userID = editUserModalContainer.getAttribute("data-user-id") as string;
        fetchEditUsername(parseInt(userID), newUsername);
    })
}

function editPassword() {
    (document.querySelector("#password-form") as HTMLFormElement).addEventListener("submit", (evt : SubmitEvent) => {
        evt.preventDefault();
        const newPassword = (document.querySelector("#password") as HTMLInputElement).value;
        const editUserModalContainer = document.querySelector("#editModal") as HTMLDivElement;
        const userID = editUserModalContainer.getAttribute("data-user-id") as string;
        fetchEditPassword(parseInt(userID), newPassword);
    })
}

async function fetchEditPassword(userID : number, password : string) {
    try {
        const res = await fetch("http://localhost:8080/users/password/" + userID, {
            method : "PATCH",
            credentials : "include",
            body : JSON.stringify({password : password })
        })

        const data : { message : string } = await res.json();

        if (res.ok) {
            window.location.reload();
        }

        console.log(res.status);
        console.log(data.message);

    } catch(err) {
        console.error(err);
    }
}


async function fetchEditUsername(userID : number, username : string) {
    try {
        const res = await fetch("http://localhost:8080/users/username/" + userID, {
            method : "PATCH",
            credentials : "include",
            body : JSON.stringify({username : username})
        })

        const data : { message : string } = await res.json();

        if (res.ok) {
            window.location.reload();
        }

        console.log(res.status);
        console.log(data.message);

    } catch(err) {
        console.error(err);
    }
}



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
