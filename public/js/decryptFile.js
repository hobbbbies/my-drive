async function downloadFromFetch(uniqueFileName) {
  const res = await fetch(`/download/?uniqueFileName=${uniqueFileName}`); 
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // Try to read filename from Content-Disposition
  const cd = res.headers.get("Content-Disposition") || "";
  const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  const filename = match ? decodeURIComponent(match[1]) : "download.bin";

  const blob = await res.blob(); // Will be encrypted
  if (!blob) throw new Error("Failed to fetch blob");

  const ivHeader = res.headers.get("X-File-IV");
  const ivArray = ivHeader ? JSON.parse(ivHeader) : null;
  if (!ivArray) throw new Error("No IV found in response headers");
  const key = await getKey(uniqueFileName);

  const decryptedBlob = await decryptFile(blob, key, ivArray);
  if (!decryptedBlob) throw new Error("Decryption failed");

  const href = URL.createObjectURL(decryptedBlob);

  // Create a temporary <a> and click it
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;     // suggested name
  document.body.appendChild(a); // some browsers need it in the DOM
  a.click();
  a.remove();

  URL.revokeObjectURL(href); // cleanup
}

async function decryptFile(encryptedBlob, keyBase64, ivArray) {
    const keyBuffer = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
    const iv = new Uint8Array(ivArray);

    const key = await window.crypto.subtle.importKey(
        "raw", keyBuffer, { name: "AES-GCM" }, false, ["decrypt"]
    );

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