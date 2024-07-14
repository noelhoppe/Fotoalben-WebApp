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
/**
 * Wechsele die Sichtbarkeit des Passwortes
 */
function togglePasswordVisibility() {
    const checkbox = document.getElementById("togglePasswordVisibility");
    checkbox.addEventListener("change", () => {
        const password = document.getElementById("password");
        if (password.type == "password") {
            password.type = "text";
        }
        else {
            password.type = "password";
        }
    });
}
togglePasswordVisibility();
/**
 * Funktion zum Einloggen eines Benutzers
 */
function login() {
    const serverRes = document.getElementById("serverResponse");
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", (evt) => __awaiter(this, void 0, void 0, function* () {
        evt.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const reqData = {
            user: {
                username: username,
                password: password
            }
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
        if (res.redirected) {
            window.location.href = res.url; // https://stackoverflow.com/questions/39735496/redirect-after-a-fetch-post-call
            serverRes.textContent = "";
        }
        else {
            const data = yield res.json();
            serverRes.textContent = data.message;
        }
    }));
}
login();
