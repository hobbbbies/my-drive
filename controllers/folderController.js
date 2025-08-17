require('dotenv').config();
const { fileDelete } = require("./indexController");
const { shareFile } = require("./fileController");

async function folderPost (req, res) {
    try {
        const { folderName, folder: parentid } = req.body;
        const userid = req.user.id;
        if (parentid !== "") {
            const { error: folderError} = await req.supabaseClient
                                                    .from('Folder')
                                                     .insert({ name: folderName, parentid: parentid, userid: userid });   
            if (folderError) {
                console.error("Error creating folder in database:", folderError);
                return res.status(500).send("Error creating folder");
            }
        } else {
            const { error: folderError} = await req.supabaseClient
                                                    .from('Folder')
                                                    .insert({ name: folderName, userid: userid });   
            if (folderError) {
                console.error("Error creating folder in database:", folderError);
                return res.status(500).send("Error creating folder");
            }
        }

        // const { error: storageError} = await req.supabaseClient
        //     .storage
        //     .from('uploads') 
        //     .upload(folderName);

        // if (storageError) {
        //     console.error("Error creating folder in storage:", storageError);
        //     return res.status(500).send("Error uploading folder into storage");
        // }

        res.redirect("/");
  } catch (error) {
        console.error("Server error: ", error);
        res.status(500).json({ error: error.message });
  }
}

async function folderCreateGet(req, res) {
    try {
        const { data: folders, error} = await req.supabaseClient
                            .from('Folder')
                            .select();
        if (error) {
            console.log("Error getting folders: ", error);
            res.status(500).json({ error: error.message });
        }
        res.render('folderCreateView', { folders: folders, user: req.user });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
}

async function folderDelete(req, res) {
    try{        
        const { data: nestedFolders, error: selectError } = await req.supabaseClient
                                                                        .from('Folder')
                                                                        .select()
                                                                        .eq('parentid', req.query.id);
        if (selectError) {
            console.error("Error selecting nested folders:", selectError);
            return res.status(500).send("Error finding nested folders");
        }

        const { data: files, error: fileError } = await req.supabaseClient
                                                                .from('File')
                                                                .select()
                                                                .eq('folderid', req.query.id);
        if (fileError) {
            console.error("Error selecting nested files:", fileError);
            return res.status(500).send("Error finding nested files");
        }

        const { data: parentFolder, error: parentError } = await req.supabaseClient 
                                                                        .from('Folder')
                                                                        .select('name')
                                                                        .eq('id', req.query.id)
                                                                        .single()
        if (parentError) {
            console.error("Error selecting parent folder:", fileError);
            return res.status(500).send("Error selecting parent folder");
        }
        try {
            await deleteAllFiles(req, files, parentFolder.name);
            await folderDeleteRecursively(req, nestedFolders);
        } catch(error) {
            console.error(error);
            return res.status(500).send("Error in helper functions");
        }

        const { error: folderError } = await req.supabaseClient.from('Folder').delete().eq('id', req.query.id);
        if (folderError) {
            console.error("Error deleting folder: ", folderError.message);
            return res.status(500).send("Error deleting folder on the DB side.");
        }
        const referrer = req.get('Referer') || '/';
        res.redirect(referrer);
    } catch(error) {
        console.error(error);
        res.status(500).send("Error deleting folder");
    }
}

async function folderDeleteRecursively(req, folders) {
    // base case - ends if no nested folders 
    if (!folders || !folders.length) return;
    for (const folder of folders) {
        const { data: nestedFolders, error: selectError } = await req.supabaseClient
                                    .from('Folder')
                                    .select()
                                    .eq('parentid', folder.id);
        if (selectError) {
            console.log(selectError);
            throw selectError;  // Changed from return to throw
        }              
        // Recursively call function on nested folders
        await folderDeleteRecursively(req, nestedFolders);

        // Selects all files inside nested folders for deletion
        const { data: files, error: fileError } = await req.supabaseClient
                                                .from('File')
                                                .select()
                                                .eq('folderid', folder.id);
        if (fileError) {
            console.log(fileError);
            throw fileError;  // Changed from return to throw
        }
        // Deletes all selected files
        try {
            await deleteAllFiles(req, files, folder.name);
        } catch(error) {
            throw error;  // Changed from return to throw
        }

        // deletes nested folder
        const { error: folderError } = await req.supabaseClient    
                                            .from('Folder')
                                            .delete()
                                            .eq('id', folder.id);
        if (folderError) {
            console.log(folderError);
            throw folderError;  // Changed from return to throw
        }
    }
}

async function deleteAllFiles(req, files, folderName) {
    for (const file of files) {
        const { error: fileError } = await req.supabaseClient
                                                .from('File')
                                                .delete()
                                                .eq('id', file.id); 
        if (fileError) {
            console.log(fileError);
            throw fileError;
        }

        const { error: storageError } = await req.supabaseClient
                                                .storage
                                                .from('uploads')
                                                .remove([`${folderName}/${file.id}`])    
        if (storageError) {
            console.log(storageError);
            throw new Error(storageError.message || "Error removing file from storage");  // Added error message
        }
    }
}

async function shareFolder(req, res) {
    try {
        const { itemId, email, itemType } = req.body;

        // Validate input
        if (!itemId || !email || itemType !== "folder") {
            return res
                .status(400)
                .json({ error: "Missing required fields or invalid item type" });
        }

        // Get the parent folder info
        const { data: parentFolder, error: parentError } = await req.supabaseClient 
            .from('Folder')
            .select('id, name') // Need id for the recursive function
            .eq('id', itemId)
            .single();
            
        if (parentError) {
            console.error("Error selecting parent folder:", parentError);
            return res.status(500).send("Error selecting parent folder");
        }

        try {
            // Pass parentFolder as array with email parameter
            await shareFoldersRecursively(req, [parentFolder], email);
        } catch(error) {
            console.error(error);
            return res.status(500).send("Error sharing folder");
        }

        // Return success response instead of deleting
        res.status(200).json({ 
            message: 'Folder shared successfully',
            sharedWith: email
        });

    } catch(error) {
        console.error(error);
        res.status(500).send("Error sharing folder");
    }
}

async function shareAllFiles(req, files, email) {
    // Find user by email to get their UUID
    const { data: userData, error: userError } = await req.supabaseClient
        .from("User")
        .select("id")
        .eq("email", email)
        .single();

    if (userError || !userData) {
        console.error("Error finding user by email:", userError);
        throw new Error("User not found with this email address");
    }

    const sharedToUserId = userData.id;

    for (const file of files) {
        const { data: fileInfo, error: fetchError } = await req.supabaseClient
            .from("File")
            .select("shared_with, userid")
            .eq("id", file.id)
            .single();

        if (fetchError || !fileInfo) {
            console.error("Error fetching file info:", fetchError);
            throw new Error(`File not found: ${file.id}`);
        }

        // // Check if user owns the file
        // if (fileInfo.userid !== req.user.id) {
        //     console.error(`User does not own file: ${file.id}`);
        //     continue; // Skip this file instead of throwing error
        // }

        // Get current shared_with array or initialize as empty array
        let currentSharedWith = fileInfo.shared_with || [];

        // Check if user is already in the shared_with array
        if (currentSharedWith.includes(sharedToUserId)) {
            console.log(`File ${file.id} already shared with user ${email}`);
            continue; // Skip if already shared
        }

        // Add the new user ID to the shared_with array
        const updatedSharedWith = [...currentSharedWith, sharedToUserId];

        // Update the file with the new shared_with array
        const { error: updateError } = await req.supabaseClient
            .from("File")
            .update({ shared_with: updatedSharedWith })
            .eq("id", file.id);

        if (updateError) {
            console.error("Error updating file shared_with:", updateError);
            throw new Error(`Failed to share file: ${file.id}`);
        }
    }
}

async function shareFoldersRecursively(req, folders, email) {
    // base case - ends if no nested folders 
    if (!folders || !folders.length) return;
    
    // Find user by email to get their UUID (do this once at the start)
    const { data: userData, error: userError } = await req.supabaseClient
        .from("User")
        .select("id")
        .eq("email", email)
        .single();

    if (userError || !userData) {
        console.error("Error finding user by email:", userError);
        throw new Error("User not found with this email address");
    }

    const sharedToUserId = userData.id;
    
    for (const folder of folders) {
        // Share the folder itself first
        const { data: folderInfo, error: folderFetchError } = await req.supabaseClient
            .from("Folder")
            .select("shared_with, userid")
            .eq("id", folder.id)
            .single();

        if (folderFetchError || !folderInfo) {
            console.error("Error fetching folder info:", folderFetchError);
            throw new Error(`Folder not found: ${folder.id}`);
        }

        // Get current shared_with array for folder or initialize as empty array
        let currentFolderSharedWith = folderInfo.shared_with || [];

        // Check if user is already in the folder's shared_with array
        if (!currentFolderSharedWith.includes(sharedToUserId)) {
            // Add the new user ID to the folder's shared_with array
            const updatedFolderSharedWith = [...currentFolderSharedWith, sharedToUserId];

            // Update the folder with the new shared_with array
            const { error: folderUpdateError } = await req.supabaseClient
                .from("Folder")
                .update({ shared_with: updatedFolderSharedWith })
                .eq("id", folder.id);

            if (folderUpdateError) {
                console.error("Error updating folder shared_with:", folderUpdateError);
                throw new Error(`Failed to share folder: ${folder.id}`);
            }
        }

        // Get nested folders for recursion
        const { data: nestedFolders, error: selectError } = await req.supabaseClient
                                    .from('Folder')
                                    .select()
                                    .eq('parentid', folder.id);
        if (selectError) {
            console.log(selectError);
            throw selectError;
        }              
        
        // Recursively call function on nested folders
        await shareFoldersRecursively(req, nestedFolders, email);

        // Selects all files inside current folder for sharing
        const { data: files, error: fileError } = await req.supabaseClient
                                                .from('File')
                                                .select()
                                                .eq('folderid', folder.id);
        if (fileError) {
            console.log(fileError);
            throw fileError;
        }
        
        // Shares all selected files
        try {
            await shareAllFiles(req, files, email);
        } catch(error) {
            throw error;
        }
    }
}

module.exports = { folderPost, folderCreateGet, folderDelete, shareFolder }