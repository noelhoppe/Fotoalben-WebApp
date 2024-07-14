/**
 * Wechsele die Sichtbarkeit des Passwortes
 */
function togglePasswordVisibility() {
    const checkbox = document.getElementById("togglePasswordVisibility") as HTMLInputElement;
    checkbox.addEventListener("change", () => {
        const password : HTMLInputElement = document.getElementById("password") as HTMLInputElement;
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
    const serverRes : HTMLParagraphElement = document.getElementById("serverResponse") as HTMLParagraphElement;

    const loginForm = document.getElementById("loginForm") as HTMLFormElement;
    loginForm.addEventListener("submit", async(evt : SubmitEvent) => {
        evt.preventDefault();
        const username : string = (document.getElementById("username") as HTMLInputElement).value;
        const password : string = (document.getElementById("password") as HTMLInputElement).value;

        const reqData = {
            user : {
                username : username,
                password : password
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

        if (res.redirected){
            window.location.href = res.url; // https://stackoverflow.com/questions/39735496/redirect-after-a-fetch-post-call
            serverRes.textContent = "";
        }
        else {
            const data = await res.json();
            serverRes.textContent = data.message;
        }
    })
}
login();