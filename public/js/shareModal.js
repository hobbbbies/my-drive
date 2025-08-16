// Share modal variables
const shareModal = document.getElementById("shareModal");
const shareModalTitle = document.getElementById("share-modal-title");
const shareEmail = document.getElementById("shareEmail");
const shareLink = document.getElementById("shareLink");
let currentShareItem = { id: null, name: null, type: null };

// Share functionality
function openShareModal(itemId, itemName, itemType) {
    currentShareItem = { id: itemId, name: itemName, type: itemType };
    shareModalTitle.textContent = `Share "${itemName}"`;
    
    // Generate share link
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/shared/${itemType}/${itemId}`;
    shareLink.value = shareUrl;
    
    // Reset form
    shareEmail.value = '';
    document.getElementById('shareSuccess').style.display = 'none';
    document.getElementById('shareError').style.display = 'none';
    
    shareModal.style.display = "block";
}

function closeShareModal() {
    shareModal.style.display = "none";
    currentShareItem = { id: null, name: null, type: null };
}

async function sendShare() {
    const email = shareEmail.value.trim();
    const permissions = document.getElementById('permissions').value;
    
    if (!email) {
        alert('Please enter an email address');
        return;
    }
    
    if (!currentShareItem.id) {
        alert('No item selected for sharing');
        return;
    }

    if (!type) {
        console.error("No type specified for sharing");
        return;
    }

    const sendBtn = document.getElementById('sendShareBtn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    try {
        const response = await fetch('/share', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itemId: currentShareItem.id,
                itemName: currentShareItem.name,
                itemType: currentShareItem.type,
                email: email,
                permissions: permissions
            })
        });

        if (response.ok) {
            document.getElementById('shareSuccess').style.display = 'block';
            document.getElementById('shareError').style.display = 'none';
            shareEmail.value = '';
        } else {
            throw new Error('Failed to send share');
        }
    } catch (error) {
        console.error('Share error:', error);
        document.getElementById('shareError').style.display = 'block';
        document.getElementById('shareSuccess').style.display = 'none';
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
    }
}

function copyShareLink() {
    shareLink.select();
    shareLink.setSelectionRange(0, 99999);
    document.execCommand('copy');
    
    const copyBtn = event.target;
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 2000);
}

// Close share modal when clicking outside
document.addEventListener('DOMContentLoaded', function() {
    window.addEventListener('click', function(event) {
        if (event.target === shareModal) {
            closeShareModal();
        }
    });
});