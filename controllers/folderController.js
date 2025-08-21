require('dotenv').config();
const deleteFile = require("../helpers/deleteFile");
const shareFile = require('../helpers/shareFile');

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
                            .select()
                            .eq('userid', req.user.id);

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
    try {
        const shared = req.query.shared === 'true';
        
        if (!shared) {
            // Deleting own folder - remove folder completely
            const { data: parentFolder, error: parentError } = await req.supabaseClient 
                .from('Folder')
                .select('id, name')
                .eq('id', req.query.id)
                .single();
                
            if (parentError) {
                console.error("Error selecting parent folder:", parentError);
                return res.status(500).send("Error selecting parent folder");
            }

            // Delete all SharedFolders records that reference this folder first
            const { error: sharedDeleteError } = await req.supabaseClient
                .from("SharedFolders")
                .delete()
                .eq("folderid", req.query.id);

            if (sharedDeleteError) {
                console.error("Error deleting shared folder records: ", sharedDeleteError.message);
                return res.status(400).send("Error removing folder shares");
            }
            
            try {
                // Pass parentFolder as array to match the recursive function pattern
                await deleteFoldersRecursively(req, [parentFolder]);
            } catch(error) {
                console.error(error);
                return res.status(500).send("Error in helper functions");
            }
        } else {
            // Removing shared folder - only remove the share record for this user
            const { data: parentFolder, error: parentError } = await req.supabaseClient
                .from('Folder')
                .select('id, name')
                .eq('id', req.query.id)
                .single();

            if (parentError) {
                console.error("Error selecting parent folder:", parentError);
                return res.status(500).send("Error selecting parent folder");
            }

            try {
                await unshareFoldersRecursively(req, [parentFolder], req.user.id);
            } catch (error) {
                console.error(error);
                return res.status(500).send("Error unsharing folder and its contents");
            }
        }
        
        const referrer = req.get('Referer') || '/';
        res.redirect(referrer);
    } catch(error) {
        console.error(error);
        res.status(500).send("Error deleting folder");
    }
}

async function deleteFoldersRecursively(req, folders) {
    // base case - ends if no nested folders 
    if (!folders || !folders.length) return;
    
    for (const folder of folders) {
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
        await deleteFoldersRecursively(req, nestedFolders);

        // Selects all files inside current folder for deletion
        const { data: files, error: fileError } = await req.supabaseClient
                                                .from('File')
                                                .select()
                                                .eq('folderid', folder.id);
        if (fileError) {
            console.log(fileError);
            throw fileError;
        }
        
        // Deletes all selected files
        try {
            await deleteAllFiles(req, files, folder.name);
        } catch(error) {
            throw error;
        }

        // Delete the folder itself last
        const { error: folderError } = await req.supabaseClient    
                                            .from('Folder')
                                            .delete()
                                            .eq('id', folder.id);
        if (folderError) {
            console.log(folderError);
            throw folderError;
        }
    }
}

async function deleteAllFiles(req, files, folderName) {
    for (const file of files) {
        try {
            await deleteFile(req.supabaseClient, file.unique_fname, req.user.id);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

async function shareFolderController(req, res) {
    try {
        const { itemId: folderid, email, permissions } = req.body;

        // Validate input
        if (!folderid || !email) {
            return res
                .status(400)
                .json({ error: "Missing required fields" });
        }

        // Get the parent folder info
        const { data: parentFolder, error: parentError } = await req.supabaseClient 
            .from('Folder')
            .select('id, name')
            .eq('id', folderid)
            .single();
            
        if (parentError) {
            console.error("Error selecting parent folder:", parentError);
            return res.status(500).send("Error selecting parent folder");
        }

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

        try {
            // Pass parentFolder as array with email parameter
            await shareFoldersRecursively(req, [parentFolder], userData.id, false);
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

async function shareFoldersRecursively(req, folders, recipientId, shareParents=true) {
    // base case - ends if no nested folders 
    if (!folders || !folders.length) return;
    
    for (const folder of folders) {
        // Share the current folder using the helper function
        await shareFolder(req.supabaseClient, folder, recipientId, req.user.id, shareParents);

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
        await shareFoldersRecursively(req, nestedFolders, recipientId);

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
            await shareAllFiles(req, files, recipientId);
        } catch(error) {
            throw error;
        }
    }
}

async function shareFolder(supabaseClient, folder, recipientId, currentUserId, shareParents) {
    try {
        // Validate input
        if (!folder.id || !recipientId) {
            throw new Error("Missing required fields: folder.id and recipientId are required");
        }

        if (currentUserId === recipientId) {
            return {
                success: false,
                error: "You cannot share folders with yourself"
            };
        }

        // Check if folder is already shared with this user
        const { data: existingShare, error: checkError } = await supabaseClient
            .from('SharedFolders')
            .select('id')
            .eq('folderid', folder.id)
            .eq('shared_with', recipientId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error("Error checking existing share:", checkError);
            throw new Error("Error checking existing shares");
        }

        if (existingShare) {
            // This is NOT an error - just return success with info message
            console.log(`Folder ${folder.id} already shared with user ${recipientId}`);
            return { 
                success: true, 
                alreadyShared: true, 
                message: "Folder is already shared with this user" 
            };
        }

        const { error: shareError } = await supabaseClient
            .from('SharedFolders')
            .insert({
                folderid: folder.id,
                shared_by: currentUserId, 
                shared_with: recipientId,
                permissions: 'view', // Default permission
                share_parents: shareParents 
            });

        if (shareError) {
            console.error("Error sharing folder:", shareError);
            throw new Error(shareError.message || "Error sharing folder");
        }

        console.log(`Successfully shared folder ${folder.id} with user ${recipientId}`);
        return { 
            success: true, 
            message: "Folder shared successfully" 
        };

    } catch (error) {
        console.error("Share folder helper error:", error);
        return { 
            success: false, 
            error: error.message || "Error sharing folder" 
        };
    }
}

async function shareAllFiles(req, files, recipientId) {
    // Remove the user lookup since we already have the UUID
    for (const file of files) {
        try {
            const result = await shareFile(
                req.supabaseClient,
                req.user.id,
                file.unique_fname,
                recipientId, // Use recipientId directly
                'view',
                true   
            );

            if (result.success) {
                console.log(`Successfully shared file ${file.id} with user ${recipientId}`);
            } else if (result.alreadyShared) {
                console.log(`File ${file.id} already shared with user ${recipientId}`);
            } else {
                console.error(`Error sharing file ${file.id}:`, result.error);
            }

        } catch (error) {
            console.error(`Error sharing file ${file.id} with user ${recipientId}:`, error.message);
        }
    }
}

async function unshareFoldersRecursively(req, folders, userId) {
    if (!folders || !folders.length) return;

    for (const folder of folders) {
        // Remove share for this folder
        await req.supabaseClient
            .from("SharedFolders")
            .delete()
            .eq("folderid", folder.id)
            .eq("shared_with", userId);

        // Remove share for all files in this folder
        const { data: files, error: fileError } = await req.supabaseClient
            .from('File')
            .select()
            .eq('folderid', folder.id);
        if (fileError) {
            console.log(fileError);
            throw fileError;
        }
        for (const file of files) {
            await req.supabaseClient
                .from("SharedFiles")
                .delete()
                .eq("file_name", file.unique_fname)
                .eq("shared_with", userId);
        }

        // Get nested folders and recurse
        const { data: nestedFolders, error: selectError } = await req.supabaseClient
            .from('Folder')
            .select()
            .eq('parentid', folder.id);
        if (selectError) {
            console.log(selectError);
            throw selectError;
        }
        await unshareFoldersRecursively(req, nestedFolders, userId);
    }
}

module.exports = { folderPost, folderCreateGet, folderDelete, shareFolderController }