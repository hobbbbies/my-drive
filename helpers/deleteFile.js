async function deleteFile(supabaseClient, unique_fname, userId) {
      // Delete all SharedFiles records that reference this file first
      const { error: sharedDeleteError } = await supabaseClient
        .from("SharedFiles")
        .delete()
        .eq("file_name", unique_fname);

      if (sharedDeleteError) {
        console.error("Error deleting shared file records: ", sharedDeleteError.message);
        throw sharedDeleteError;
      }
    
    // Remove from storage
    const { error: storageError } = await supabaseClient
        .storage
        .from("uploads")
        .remove([unique_fname]);
    if (storageError) {
        console.error("Error deleting file from storage:", storageError);
        throw storageError;
    }

    // Remove from database
    const { error: dbError } = await supabaseClient
        .from("File")
        .delete()
        .eq("unique_fname", unique_fname)
        .eq("userid", userId);
    if (dbError) {
        console.error("Error deleting file from database:", dbError);
        throw dbError;
    }
}

module.exports = deleteFile;