// TODO: Use of modules ES/CJS, um togglePasswordVisibility zu nutzen

interface User {
    id : number
    username : string,
    password : string,
    role : string
}


function initializePage() { // FIXME: TS2393: Duplicate function implementation?
    document.addEventListener("DOMContentLoaded", async() => {
        await fetchUsers();
    })
}
initializePage();

function searchUser() {
    const queryUsernameForm = document.querySelector("#queryUsername") as HTMLFormElement;
    console.log(queryUsernameForm);
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
            const data : { users : User[] }= await res.json();
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

    const {id, username, password, role} = user; // DESTRUCTURING
    const newRow = tbodyContainer.insertRow();
    newRow.setAttribute("data-Users_ID", id.toString());

    newRow.insertCell().textContent = username;
    newRow.insertCell().textContent = role;

    const actionCell = newRow.insertCell();
    actionCell.innerHTML = `
          <div class="row gy-3">
            <div class="col d-flex align-items-center">
              <button class="btn btn-warning w-100" data-bs-toggle="modal" data-bs-target="#editModal">Bearbeiten</button>
            </div>
            <div class="col d-flex align-items-center">
              <button class="btn btn-danger w-100">
                Benutzer löschen
              </button>
            </div>
          </div>
    `;
}
// renderSingleUserRow({id : 1, username : "Noel", password : "0610", role : "ADMIN"});

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