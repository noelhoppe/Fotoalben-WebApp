const passwd : HTMLInputElement = document.getElementById("password") as HTMLInputElement;
const checkbox : HTMLInputElement = document.getElementById("togglePasswordVisibility") as HTMLInputElement;
const loginForm : HTMLFormElement = document.getElementById("loginForm") as HTMLFormElement;
const serverRes : HTMLParagraphElement = document.getElementById("serverResponse") as HTMLParagraphElement;
const serverAdress : string = "http://localhost:8080";

/**
 * Wechsle die Sichtbarkeit des Passworts, wenn man den Wert der checkbox ändert.
 */
checkbox.addEventListener("change", () => {
    togglePasswordVisibility();
})

/**
 * Funktion, die die Sichtbarkeit des Passworts wechselt (sichtbar ↔ unsichtbar).
 */
function togglePasswordVisibility() : void {
    if (passwd.type == "password") {
        passwd.type = "text";
    } else {
        passwd.type = "password";
    }
}

loginForm.addEventListener("submit", async (evt: SubmitEvent) => {
    evt.preventDefault();
    const username : string = (document.getElementById("username") as HTMLInputElement).value;
    const password : string = (document.getElementById("password") as HTMLInputElement).value;

    const reqData = {
        user : {
            username : username,
            password : password
        }
    };

    loginForm.addEventListener("submit", async (evt: SubmitEvent) => {
        evt.preventDefault();
        const username : string = (document.getElementById("username") as HTMLInputElement).value;
        const password : string = (document.getElementById("password") as HTMLInputElement).value;

        const reqData = {
            user : {
                username : username,
                password : password
            }
        };

        const res : Response = await fetch(serverAdress + "/login", {
            method: "POST",
            credentials : "include",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(reqData),
        });

        const data = await res.json();
        console.log(res.status);
        if (res.ok){
            serverRes.textContent = "";
            window.location.href = "/photoalbums.html";
        }
        else {
            serverRes.textContent = data.message;
        }

    });

});