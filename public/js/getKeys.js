document.addEventListener('DOMContentLoaded', () => {
    const key = localStorage.getItem("encryptionKey");
    console.log("Encryption Key:", key);
    document.querySelector('#encryption-key').innerText = key || '';
})
