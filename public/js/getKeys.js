document.addEventListener('DOMContentLoaded', () => {
    const keysContainer = document.querySelector('#encryption-key');
    keysContainer.innerHTML = ''; // Clear existing content

    // Iterate through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('encryptionKey-')) {
            const value = localStorage.getItem(key);
            const keyElement = document.createElement('li');
            keyElement.textContent = value;

            // Create and append the copy button
            const copyIcon = createCopyIcon();
            copyIcon.addEventListener('click', () => {
                navigator.clipboard.writeText(value);
            });
            keyElement.appendChild(copyIcon);

            keysContainer.appendChild(keyElement);
        }
    }
});

function createCopyIcon() {
    const svgNamespace = "http://www.w3.org/2000/svg";

    // Create the <svg> element
    const svg = document.createElementNS(svgNamespace, "svg");
    svg.setAttribute("xmlns", svgNamespace);
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("class", "bi bi-copy copy-btn");
    svg.setAttribute("viewBox", "0 0 16 16");

    // Create the <path> element
    const path = document.createElementNS(svgNamespace, "path");
    path.setAttribute("fill-rule", "evenodd");
    path.setAttribute(
        "d",
        "M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"
    );

    // Append the <path> to the <svg>
    svg.appendChild(path);

    return svg;
}
