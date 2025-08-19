// File details modal functionality
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalSize = document.getElementById("modal-size");
const modalExt = document.getElementById("modal-ext");
const modalAdded = document.getElementById("modal-added");
const downloadLink = document.getElementById("download-link");
const deleteLink = document.getElementById("delete-link");
const fileItems = document.querySelectorAll(".file-item");
const closeBtn = document.querySelector(".close");

// Store current file info for sharing
let currentFileForSharing = { pathOrId: null, name: null };

// File item click handlers
fileItems.forEach((item) => {
    item.onclick = (e) => {
        // Don't open modal if clicking on share button
        if (e.target.closest('.share-file')) return;
        
        // Get file metadata from data attributes
        const fileName = item.getAttribute("data-filename");
        const storagePath = item.getAttribute("data-storagePath");
        const fileSize = item.getAttribute("data-size");
        const fileExt = item.getAttribute("data-ext");
        const fileAdded = item.getAttribute("data-added");
        const folderid = item.getAttribute("data-folderid");
        
        // Check if this is a shared file
        const isSharedFile = item.classList.contains('shared-file');
        
        // Store file info for sharing (use storagePath as unique identifier)
        currentFileForSharing = { pathOrId: storagePath, name: fileName };
        
        const trimmedAdded = new Date(fileAdded).toLocaleDateString();
        // Update modal content
        modalTitle.textContent = fileName;
        modalSize.textContent = fileSize || "--";
        modalExt.textContent = fileExt || "--";
        modalAdded.textContent = trimmedAdded || "--";

        // Set download link
        downloadLink.setAttribute("href", `/download/?storagePath=${encodeURIComponent(storagePath)}`);
        deleteLink.setAttribute("href", `/delete/?storagePath=${encodeURIComponent(storagePath)}&shared=${!!isSharedFile}`);

        // Show the modal
        modal.style.display = "block";
    };
});

// Close button handler
closeBtn.onclick = (e) => {
    e.preventDefault();
    modal.style.display = "none";
};

// Close modal when clicking outside the content
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
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

// Delete folder function
function deleteFolder(folderId, shared=false) {
    if (confirm('Are you sure you want to delete this folder? This action cannot be undone.')) {
        window.location.href = `/folder/delete/?id=${folderId}&shared=${shared}`;
    }
}

// Make functions available globally for onclick handlers
window.shareFromModal = shareFromModal;
window.deleteFolder = deleteFolder;