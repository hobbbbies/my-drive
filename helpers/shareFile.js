// this was moved from fileController since it was also used by folderController
async function shareFile(supabaseClient, currentUserId, storagePath, recipientId, permissions, shareParents) {
  try {
    // Validate input
    if (!storagePath || !recipientId) {
      throw new Error("Missing required fields: storagePath and recipientId are required");
    }
    
    if (currentUserId === recipientId) {
      return {
        success: false,
        error: "You cannot share files with yourself"
      };
    }

    // Use upsert to handle both insert and update cases
    const { data, error: shareError } = await supabaseClient
      .from('SharedFiles')
      .upsert({
          file_path: storagePath,
          shared_by: currentUserId,
          shared_with: recipientId,
          permissions: permissions || 'view',
          share_parents: shareParents || false
      }, {
          onConflict: 'file_path,shared_with' // Specify the unique constraint columns
      });

    if (shareError) {
      console.error("Error sharing file:", shareError);
      throw new Error(shareError.message || "Error sharing file");
    }

    return { 
      success: true, 
      message: "File shared successfully" 
    };

  } catch (error) {
    console.error("Share file helper error:", error);
    return { 
      success: false, 
      error: error.message || "Error sharing file" 
    };
  }
}

module.exports = shareFile;