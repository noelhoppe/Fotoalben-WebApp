/**
 * Wechsele die Sichtbarkeit des Passwortes
 */
export default function togglePasswordVisibility() {
    console.log("called");
    const checkbox = document.getElementById("togglePasswordVisibility") as HTMLInputElement;
    checkbox.addEventListener("change", () => {
        const inputField = document.getElementById("password") as HTMLInputElement;
        if (inputField.type == "password") {
            inputField.type = "text";
        } else {
            inputField.type = "password";
        }
    })
}
togglePasswordVisibility();

/**
 * Funktion zum Einloggen eines Benutzers
 */
function login() {
    interface ServerReq {
        username : string,
        password : string
    }

    interface ServerRes {
        message : string
    }

    const loginForm = document.getElementById("loginForm") as HTMLFormElement;
    loginForm.addEventListener("submit", async(evt : SubmitEvent) => {
        evt.preventDefault();

        const reqData : ServerReq = {
            username : (document.getElementById("username") as HTMLInputElement).value,
            password : (document.getElementById("password") as HTMLInputElement).value
        };

        const res : Response = await fetch("http://localhost:8080/login", {
            method: "POST",
            redirect : "follow", // https://stackoverflow.com/questions/39735496/redirect-after-a-fetch-post-call
            credentials : "include",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(reqData),
        });

        const serverRes = document.getElementById("error-login") as HTMLParagraphElement;
        const serverResContainer = document.getElementById("error-login-container") as HTMLDivElement;
        if (res.redirected){
            serverResContainer.classList.add("d-none");
            window.location.href = res.url; // https://stackoverflow.com/questions/39735496/redirect-after-a-fetch-post-call
        }
        else {
            serverResContainer.classList.remove("d-none");
            const data = await res.json() as ServerRes;
            serverRes.textContent = data.message;
        }
    })
}
login();