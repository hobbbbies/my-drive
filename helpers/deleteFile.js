async function deleteFile(supabaseClient, unique_fname, userId) {
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