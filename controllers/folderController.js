require('dotenv').config();
const { fileDelete } = require("./indexController");

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
        if (fileError) {
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

async function folderShare(req, res) {}

module.exports = { folderPost, folderCreateGet, folderDelete }