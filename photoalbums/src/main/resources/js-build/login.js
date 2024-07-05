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
const passwd = document.getElementById("password");
const checkbox = document.getElementById("togglePasswordVisibility");
const loginForm = document.getElementById("loginForm");
const serverRes = document.getElementById("serverResponse");
const serverAdress = "http://localhost:8080";
/**
 * Wechsle die Sichtbarkeit des Passworts, wenn man den Wert der checkbox ändert.
 */
checkbox.addEventListener("change", () => {
    togglePasswordVisibility();
});
/**
 * Funktion, die die Sichtbarkeit des Passworts wechselt (sichtbar ↔ unsichtbar).
 */
function togglePasswordVisibility() {
    if (passwd.type == "password") {
        passwd.type = "text";
    }
    else {
        passwd.type = "password";
    }
}
loginForm.addEventListener("submit", (evt) => __awaiter(void 0, void 0, void 0, function* () {
    evt.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const reqData = {
        user: {
            username: username,
            password: password
        }
    };
    loginForm.addEventListener("submit", (evt) => __awaiter(void 0, void 0, void 0, function* () {
        evt.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const reqData = {
            user: {
                username: username,
                password: password
            }
        };
        const res = yield fetch(serverAdress + "/login", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(reqData),
        });
        const data = yield res.json();
        console.log(res.status);
        if (res.ok) {
            serverRes.textContent = "";
            window.location.href = "/photoalbums.html";
        }
        else {
            serverRes.textContent = data.message;
        }
    }));
}));
