require('dotenv').config();
const { fileDelete } = require("./indexController");

async function folderPost (req, res) {
    try {
        const { folderName, folder: parentId } = req.body;
        const userid = req.user.id;
        const { error: folderError} = await req.supabaseClient
                            .from('Folder')
                            .insert({ name: folderName, parentid: parentId, userid: userid });
           
        if (folderError) {
            console.error("Error creating folder in database:", folderError);
            return res.status(500).send("Error creating folder");
        }

        const { error: storageError} = await req.supabaseClient
            .storage
            .from('uploads') 
            .upload(folderName);

        if (storageError) {
            console.error("Error creating folder in storage:", storageError);
            res.status(500).send("Error uploading folder into storage");
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
                            .select();
        if (error) {
            console.log("Error getting folders: ", error);
            res.status(500).json({ error: error.message });
        }
        res.render('folderCreateView', { folders: folders });
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
        folderDeleteRecursively(req, res, nestedFolders);
        const { error: folderError } = await req.supabaseClient.from('Folder').delete().eq('id', req.query.id);
        if (folderError) {
            console.error("Error deleting folder: ", folderError.message);
            res.status(500).send("Error deleting folder on the DB side.");
        }
        const referrer = req.get('Referer') || '/';
        res.redirect(referrer);
    } catch(error) {
        console.error(error);
        res.status(500).send("Error deleting folder");
    }
}

async function folderDeleteRecursively(req, res, folders) {
    // base case - ends if no nested folders 
    if (!folders) return;
    for (const folder of folders) {
        const { data: nestedFolders, error: selectError} = await req.supabaseClient
                                    .from('Folder')
                                    .select()
                                    .eq('parentid', folder.id);
        if (selectError) {
            console.log(selectError);
            return res.status(500).send("Error selecting nested folders");
        }
        // Recursively call function on nested folders
        await folderDeleteRecursively(req, res, nestedFolders);
        // Deletes files inside nested folders
        const { error: fileError } = await req.supabaseClient
                                                .from('File')
                                                .delete()
                                                .eq('folderid', folder.id);
        if (fileError) {
            console.log(fileError);
            return res.status(500).send("Error deleting nested files");
        }
        // deletes nested folder
        const { error: folderError } = await req.supabaseClient    
                                            .from('Folder')
                                            .delete()
                                            .eq('id', folder.id);
        if (folderError) {
            console.log(folderError);
            return res.status(500).send("Error deleting nested folders");
        }
    }
}

async function folderShare(req, res) {}

module.exports = { folderPost, folderCreateGet, folderDeleteRecursively }