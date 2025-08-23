import importKey from "./importKey.js";

export default async function downloadFromFetch(uniqueFileName) {
  try {
    const res = await fetch(`/file/download/?uniqueFileName=${encodeURIComponent(uniqueFileName)}&shared=false`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // Try to read filename from Content-Disposition
    const cd = res.headers.get("Content-Disposition") || "";
    const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
    const filename = match ? decodeURIComponent(match[1]) : "download.bin";

    const blob = await res.blob(); // Will be encrypted
    if (!blob) throw new Error("Failed to fetch blob");

    const ivHeader = res.headers.get("X-File-IV");
    const ivArray = ivHeader ? JSON.parse(ivHeader) : null;
    let href;
    if (!ivArray) {
      // Not encrypted, just download
      href = URL.createObjectURL(blob);
    } else {
      let decryptedBlob;
      try {
        const key = await getKey(uniqueFileName);
        decryptedBlob = await decryptFile(blob, key, ivArray);
        if (!decryptedBlob) throw new Error("Invalid or missing decryption key");
      } catch (error) {
        setDownloadError(error.message);
        console.error("Decryption failed:", error);
        return;
      }
      href = URL.createObjectURL(decryptedBlob);
    }

    // Create a temporary <a> and click it
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;     // suggested name
    document.body.appendChild(a); // some browsers need it in the DOM
    a.click();
    a.remove();

    URL.revokeObjectURL(href); // cleanup
  } catch (error) {
    setDownloadError(error.message);
    console.error("Failed to fetch file:", error);
    throw error;
  }
}

async function decryptFile(encryptedBlob, keyBase64, ivArray) {
    const key = await importKey(keyBase64);
    if (!key) throw new Error("Failed to import decryption key");

    const iv = new Uint8Array(ivArray);


    const encryptedArrayBuffer = await encryptedBlob.arrayBuffer();
    
    try {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            encryptedArrayBuffer
        );
        return new Blob([decryptedBuffer]);
    } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Decryption failed");
    }
}

async function getKey() {
  const keyBase64 = localStorage.getItem("encryptionKey"); // But each file will have its own key
  if (!keyBase64) throw new Error("No encryption key found");

  return keyBase64;
}

// Add this helper function at the bottom of the file
function setDownloadError(message) {
  let errorElem = document.getElementById('download-error');
  if (!errorElem) {
    errorElem = document.createElement('div');
    errorElem.id = 'download-error';
    errorElem.style.color = 'red';
    errorElem.style.margin = '1em 0';
    // Try to insert near modal or at top of body
    const modal = document.querySelector('.modal') || document.body;
    modal.prepend(errorElem);
  }
  errorElem.textContent = message;
}

