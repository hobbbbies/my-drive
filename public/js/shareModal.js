// Share modal variables
const shareModal = document.getElementById("shareModal");
const shareModalTitle = document.getElementById("share-modal-title");
const shareEmail = document.getElementById("shareEmail");
const shareLink = document.getElementById("shareLink");
let currentShareItem = { id: null, name: null, type: null };

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

    if (!currentShareItem.type) {
        console.error("No type specified for sharing");
        return;
    }

    const sendBtn = document.getElementById('sendShareBtn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    try {
        const response = await fetch(`/${currentShareItem.type}/share`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itemId: currentShareItem.id,
                email: email,
                permissions: permissions,
            })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.alreadyShared) {
                // Show info message instead of success
                showMessage(`Already shared with ${email}`, 'info');
            } else {
                // Show success message
                showMessage(`Successfully shared with ${email}!`, 'success');
            }
            
            shareEmail.value = '';
            setTimeout(() => {
                shareModal.style.display = 'none';
            }, 1500);
        } else {
            showMessage(data.error || 'Failed to share', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Failed to share. Please try again.', 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
    }
}

function showMessage(message, type) {
    // You can style these differently: success (green), info (blue), error (red)
    const messageEl = type === 'error' ? shareError : shareSuccess;
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
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