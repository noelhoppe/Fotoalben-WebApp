/**
 * Rendert die Fehlermeldungen, die auftreten können, wenn man ein Foto bearbeitet.
 * @param errorContainer Der entsprechende Container, der die Error Message enthät
 * @param resetErrorMessage true, wenn die Fehlermeldung zurückgesetzt werden soll und der container versteckt werden soll; false sonst
 * @param message Die Fehlermeldung, die gerendert werden soll
 */
export function renderError(errorContainer, resetErrorMessage, message) {
    const errorParagraph = errorContainer.querySelector("p");
    if (resetErrorMessage) { // Wenn resetErrorMessage true ist, leeren wir die Fehlermeldung und verstecken den Container
        errorParagraph.textContent = '';
        errorContainer.classList.add("d-none");
    } else if (message && message.trim() != '') { // Wenn message definiert ist und nicht leer ist, zeigen wir die Fehlermeldung an
        errorParagraph.textContent = message;
        errorContainer.classList.remove("d-none");
    } else { // Wenn keine Nachricht vorhanden ist oder leer ist, verstecken wir den Container
        errorContainer.classList.add("d-none");
    }
}

/**
 * Wechsele die Sichtbarkeit des Passwortes
 */
export function togglePasswordVisibility() {
    const checkbox = document.getElementById("togglePasswordVisibility");
    checkbox.addEventListener("change", () => {
        const inputField = document.getElementById("password");
        if (inputField.type == "password") {
            inputField.type = "text";
        } else {
            inputField.type = "password";
        }
    });
}
