export default async function importKey(keyBase64) {
    try {
        const keyBuffer = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));

        const key = await window.crypto.subtle.importKey(
            "raw", keyBuffer, { name: "AES-GCM" }, false, ["decrypt"]
        )
        return key;
    } catch (error) {
        throw(error)
    }
}
