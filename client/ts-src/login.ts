const password : HTMLInputElement = document.getElementById("password") as HTMLInputElement;
const checkbox : HTMLInputElement = document.getElementById("togglePasswordVisibility") as HTMLInputElement;

/**
 * Wechsle die Sichtabrkeit des Passworts, wenn man den Wert der checkbox ändert.
 */
checkbox.addEventListener("change", () => {
    togglePasswordVisibility();
})

/**
 * Funktion, die die Sichtbarkeit des Passworts wechselt (sichtbar ↔ unsichtbar).
 */
function togglePasswordVisibility() : void {
    if (password.type == "password") {
        password.type = "text";
    } else {
        password.type = "password";
    }
}