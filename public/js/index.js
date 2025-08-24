import downloadFromFetch from './decryptFile.js';

// File details modal functionality
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalSize = document.getElementById("modal-size");
const modalExt = document.getElementById("modal-ext");
const modalAdded = document.getElementById("modal-added");
const downloadButton = document.getElementById("download-button");
const deleteLink = document.getElementById("delete-link");
const shareButton = document.getElementById("share-link"); // Add this line
const fileItems = document.querySelectorAll(".file-item");
const closeBtn = document.querySelector(".close");
const encryptionKeyForm = document.getElementById("encryption-key-form");
const encryptionNote = document.querySelector(".modal-encryption-note");

// Store current file info for sharing
let currentFileForSharing = { pathOrId: null, name: null };

// File item click handlers
fileItems.forEach((item) => {
    item.onclick = (e) => {        
        // Get file metadata from data attributes
        const fileName = item.getAttribute("data-filename");
        const uniqueFileName = item.getAttribute("data-uniqueFileName");
        console.log("unique_fname: ", uniqueFileName);
        const fileSize = item.getAttribute("data-size");
        const fileExt = item.getAttribute("data-ext");
        const fileAdded = item.getAttribute("data-added");
        const folderid = item.getAttribute("data-folderid");
        const fileEncrypted = item.getAttribute("data-encrypted") === 'true';
        console.log("fileEncrypted: ", fileEncrypted);

        // Check if this is a shared file
        const isSharedFile = item.classList.contains('shared-file');
        
        if (!fileEncrypted) {
            encryptionNote.innerHTML = "This file is <strong><i>not encrypted</i></strong>. No key required."
            encryptionKeyForm.style.display = 'none';
        } else {
            encryptionNote.innerHTML = "This file is <strong><i>encrypted</i></strong>. Enter your key to decrypt the file."
            encryptionKeyForm.style.display = 'block';
        }

        // Handle share button visibility and functionality
        if (isSharedFile) {
            shareButton.style.display = 'none'; 
        } else {
            shareButton.style.display = 'inline-block';
        }
        currentFileForSharing = { pathOrId: uniqueFileName, name: fileName };
        const trimmedAdded = new Date(fileAdded).toLocaleDateString();
        
        // Update modal content
        modalTitle.textContent = fileName;
        modalSize.textContent = fileSize || "--";
        modalExt.textContent = fileExt || "--";
        modalAdded.textContent = trimmedAdded || "--";

        // Set delete link
        deleteLink.setAttribute("href", `/file/delete/?uniqueFileName=${encodeURIComponent(uniqueFileName)}&shared=${!!isSharedFile}`);

        // Show the modal
        modal.style.display = "block";
    };
});

// Close button handler
closeBtn.onclick = (e) => {
    e.preventDefault();
    modal.style.display = "none";
    document.getElementById('download-error').textContent = '';
};

// Close modal when clicking outside the content
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
        document.getElementById('download-error').textContent = '';
    }
};

/**
 * Opens share modal and closes the file details modal
 * @param {string} type - The type of item being shared ('file' or 'folder')
 */
function shareFromModal() {
    if (currentFileForSharing.pathOrId && currentFileForSharing.name) {
        // Close file details modal
        modal.style.display = "none";
        openShareModal(currentFileForSharing.pathOrId, currentFileForSharing.name, 'file');
    }
}

async function downloadFromModal() {
    console.log("Downloading file:", currentFileForSharing);
    const uniqueFileName = currentFileForSharing.pathOrId;
    if (uniqueFileName) {
        try {
            await downloadFromFetch(uniqueFileName);
        } catch (error) {
            console.error("Failed to download file:", error);
        }
    }
} 

// Delete folder function
function deleteFolder(folderId, shared=false) {
    if (confirm('Are you sure you want to delete this folder? This action cannot be undone.')) {
        window.location.href = `/folder/delete/?id=${folderId}&shared=${shared}`;
    }
}

// Make functions available globally for onclick handlers
window.shareFromModal = shareFromModal;
window.deleteFolder = deleteFolder;
window.downloadFromModal = downloadFromModal;