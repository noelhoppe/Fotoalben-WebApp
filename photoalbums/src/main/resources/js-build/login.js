var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Wechsele die Sichtbarkeit des Passwortes
 */
export default function togglePasswordVisibility() {
    console.log("called");
    const checkbox = document.getElementById("togglePasswordVisibility");
    checkbox.addEventListener("change", () => {
        const inputField = document.getElementById("password");
        if (inputField.type == "password") {
            inputField.type = "text";
        }
        else {
            inputField.type = "password";
        }
    });
}
togglePasswordVisibility();
/**
 * Funktion zum Einloggen eines Benutzers
 */
function login() {
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", (evt) => __awaiter(this, void 0, void 0, function* () {
        evt.preventDefault();
        const reqData = {
            username: document.getElementById("username").value,
            password: document.getElementById("password").value
        };
        const res = yield fetch("http://localhost:8080/login", {
            method: "POST",
            redirect: "follow", // https://stackoverflow.com/questions/39735496/redirect-after-a-fetch-post-call
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(reqData),
        });
        const serverRes = document.getElementById("error-login");
        const serverResContainer = document.getElementById("error-login-container");
        if (res.redirected) {
            serverResContainer.classList.add("d-none");
            window.location.href = res.url; // https://stackoverflow.com/questions/39735496/redirect-after-a-fetch-post-call
        }
        else {
            serverResContainer.classList.remove("d-none");
            const data = yield res.json();
            serverRes.textContent = data.message;
        }
    }));
}
login();
