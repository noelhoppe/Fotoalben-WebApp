/**
 * Wechsele die Sichtbarkeit des Passwortes
 */
function togglePasswordVisibility() {
    const checkbox = document.getElementById("togglePasswordVisibility") as HTMLInputElement;
    checkbox.addEventListener("change", () => {
        const password = document.getElementById("password") as HTMLInputElement;
        if (password.type == "password") {
            password.type = "text";
        } else {
            password.type = "password";
        }
    })
}
togglePasswordVisibility();

/**
 * Funktion zum Einloggen eines Benutzers
 */
function login() {
    interface ServerReq {
        user : {
            username : string,
            password : string
        }
    }

    interface ServerRes {
        message : string
    }

    const loginForm = document.getElementById("loginForm") as HTMLFormElement;
    loginForm.addEventListener("submit", async(evt : SubmitEvent) => {
        evt.preventDefault();

        const reqData : ServerReq = {
            user : {
                username : (document.getElementById("username") as HTMLInputElement).value,
                password : (document.getElementById("password") as HTMLInputElement).value
            }
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
            window.location.href = res.url; // https://stackoverflow.com/questions/39735496/redirect-after-a-fetch-post-call
            serverResContainer.classList.add("d-none");
        }
        else {
            const data = await res.json() as ServerRes;
            serverResContainer.classList.remove("d-none");
            serverRes.textContent = data.message;
        }
    })
}
login();