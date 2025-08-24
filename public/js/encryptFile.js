import importKey from './importKey.js';

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

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Uploading...';

        const fileInput = form.querySelector('input[type="file"]');
        const file = fileInput.files[0];
        if (!file) return;

        const formData = new FormData(form);
        const useEncryption = document.getElementById('use-encryption').checked;
        if(useEncryption) {
            const userKey = document.getElementById('encryption-key').value;
            const keyInfoDiv = document.getElementById('key-info');
            
            if (!userKey) { // NEED TO CHECK IF VALID FORMAT TOO
                // if no key, go standard procedure, otherwise use key 
                try {
                    var { encrypted, iv, key } = await encryptFile(file);
                } catch (error) {
                    console.error("Encryption failed:", error);
                    alert("Encryption failed. Key may not be valid base64 format.");
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    return;
                }
                localStorage.setItem(`encryptionKey-${formData.get('file').name}`, key);
                keyInfoDiv.style.display = 'block';
                keyInfoDiv.textContent = 'Encryption Key: ' + key;
                const copyBtn = document.getElementById('copy-btn');
                copyBtn.style.display = 'block';
                copyBtn.addEventListener('click', async function() {
                    await navigator.clipboard.writeText(key);
                }); 
            } else {
                const cryptoKey = await importKey(userKey);
                // Use the provided key
                var { encrypted, iv } = await encryptFile(file, cryptoKey);
            }
            formData.set('file', encrypted, file.name);
            formData.append('iv', JSON.stringify(iv));
        }
        // Submit via fetch
        const response = await fetch(form.action, {
            method: form.method,
            body: formData
        });

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;

        if (!response.ok) {
            alert('Upload failed.');
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const useEncryption = document.getElementById('use-encryption');
    const keyGroup = document.getElementById('encryption-key-group');
    const encryptionWarning = document.getElementById('encryption-warning');

    useEncryption.addEventListener('change', function() {
        keyGroup.style.display = this.checked ? 'block' : 'none';
        encryptionWarning.style.display = this.checked ? 'block' : 'none';
    });

    const keyInfoDiv = document.getElementById('key-info');
});