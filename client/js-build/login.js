var password = document.getElementById("password");
var checkbox = document.getElementById("togglePasswordVisibility");
/**
 * Wechsle die Sichtabrkeit des Passworts, wenn man den Wert der checkbox ändert.
 */
checkbox.addEventListener("change", function () {
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
