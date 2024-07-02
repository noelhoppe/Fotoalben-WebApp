"use strict";
const password = document.getElementById("password");
const checkbox = document.getElementById("togglePasswordVisibility");
/**
 * Wechsle die Sichtabrkeit des Passworts, wenn man den Wert der checkbox ändert.
 */
checkbox.addEventListener("change", () => {
    togglePasswordVisibility();
});
/**
 * Funktion, die die Sichtbarkeit des Passworts wechselt (sichtbar ↔ unsichtbar).
 */
function togglePasswordVisibility() {
    if (password.type == "password") {
        password.type = "text";
    }
    else {
        password.type = "password";
    }
}
