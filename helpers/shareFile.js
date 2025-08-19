// this was moved from fileController since it was also used by folderController
async function shareFile(supabaseClient, currentUserId, storagePath, recipientId, permissions, shareParents) {
  try {
    // Validate input
    if (!storagePath || !recipientId) {
      throw new Error("Missing required fields: storagePath and recipientId are required");
    }

    // Check if file is already shared with this user
    const { data: existingShare, error: checkError } = await supabaseClient
      .from('SharedFiles')
      .select('id')
      .eq('file_path', storagePath)
      .eq('shared_with', recipientId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error("Error checking existing share:", checkError);
      throw new Error("Error checking existing shares");
    }

    if (existingShare) {
      // This is NOT an error - just return success with info message
      return { 
        success: true, 
        alreadyShared: true, 
        message: "File is already shared with this user" 
      };
    }

    const { error: shareError } = await supabaseClient
      .from('SharedFiles')
      .insert({
          file_path: storagePath,
          shared_by: currentUserId,
          shared_with: recipientId,
          permissions: permissions || 'view',
          shareParents: shareParents || false
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