

// Generate a random AES-GCM key
async function generateKey() {
    return window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

// Encrypt a file (returns { encrypted, iv, key })
async function encryptFile(file) {
    const key = await generateKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    const fileBuffer = await file.arrayBuffer();
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        fileBuffer
    );

    // Export the key as base64 for storage/sharing
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);
    const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));

    return {
        encrypted: new Blob([encrypted]), // Blob for upload
        iv: Array.from(iv),                // Save IV for decryption
        key: keyBase64                     // Save/share this key securely!
    };
}

// Attach to upload form
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form.auth-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileInput = form.querySelector('input[type="file"]');
        const file = fileInput.files[0];
        if (!file) return;

        // Encrypt the file
        const { encrypted, iv, key } = await encryptFile(file);
        localStorage.setItem("encryptionKey", key);
        
        // Prepare FormData
        const formData = new FormData(form);
        formData.set('file', encrypted, file.name);
        formData.append('iv', JSON.stringify(iv));

        // Submit via fetch
        const response = await fetch(form.action, {
            method: form.method,
            body: formData
        });

        if (response.ok) {
            alert('Upload successful!\nSave this key to decrypt your file later:\n' + key);
            window.location.href = '/';
        } else {
            alert('Upload failed.');
        }
    });
});

