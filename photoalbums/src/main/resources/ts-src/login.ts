// @ts-ignore
import {togglePasswordVisibility, renderError} from "/helper.js";

togglePasswordVisibility();

/**
 * Funktion zum Einloggen eines Benutzers<br>
 * POST /login
 */
function login() {
    const loginForm = document.getElementById("loginForm") as HTMLFormElement;

    loginForm.addEventListener("submit", async (evt: SubmitEvent) => {
        evt.preventDefault();

        try {
            const reqData: { username: string, password: string } = {
                username: (document.getElementById("username") as HTMLInputElement).value,
                password: (document.getElementById("password") as HTMLInputElement).value
            };

            const res: Response = await fetch("http://localhost:8080/login", {
                method: "POST",
                redirect: "follow", // https://stackoverflow.com/questions/39735496/redirect-after-a-fetch-post-call
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reqData),
            });

            const serverResContainer = document.getElementById("error-container") as HTMLDivElement;
            if (res.redirected) {
                renderError(serverResContainer, true);
                window.location.href = res.url; // https://stackoverflow.com/questions/39735496/redirect-after-a-fetch-post-call
            } else {
                const data: { message: string } = await res.json();
                renderError(serverResContainer, false, data.message);
            }
        } catch (err) {
            console.log(err);
        }
    })
}

login();