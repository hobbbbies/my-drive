const fs = require('fs');
require('dotenv').config();

async function indexGet(req, res) {
    const { data: folders, error: folderError } = await req.supabaseClient.from('Folder').select();
    const folderid = req.params.folderid;
    
    // Get user's own files using destructuring - ONLY files owned by current user
    const { data: files, error: fileError } = folderid 
        ? await req.supabaseClient
            .from('File')
            .select()
            .eq('folderid', folderid)
            .eq('userid', req.user.id)
        : await req.supabaseClient
            .from('File')
            .select()
            .is('folderid', null)
            .eq('userid', req.user.id);

    // Get shared files (files shared with current user)
    const { data: sharedFiles, error: sharedFileError } = await req.supabaseClient
        .from('File')
        .select(`
            *,
            User:userid (
                email,
                name
            )
        `)
        .overlaps('shared_with', [req.user.id]);

    if (folderError || fileError || sharedFileError) {
        console.error("Database errors:", { folderError, fileError, sharedFileError });
        return res.status(500).send("Server error");
    }

    // Function to build parent folder path
    function buildParentPath(currentFolderId, allFolders) {
        const path = [];
        let currentId = currentFolderId;
        
        while (currentId) {
            const folder = allFolders.find(f => f.id === currentId);
            if (!folder) break;
            
            path.unshift({
                id: folder.id,
                name: folder.name
            });
            currentId = folder.parentid;
        }
        
        return path;
    }

    let nestedFolders;
    let chosenFolder = null;
    let parentFolders = [];
    const rootFolders = folders.filter((folder) => folder.parentid === null);
    
    if (folderid) {
        const { data: folderData, error: folderFetchError } = await req.supabaseClient
                            .from("Folder")
                            .select()
                            .eq('id', folderid)
                            .single();
                            
        if (folderFetchError) {
            console.error("Error fetching chosen folder:", folderFetchError);
            return res.status(404).send("Folder not found");
        }
        
        chosenFolder = folderData;
        nestedFolders = folders.filter((folder) => folder.parentid === folderid);
        
        parentFolders = buildParentPath(folderid, folders);
    } else {
        nestedFolders = rootFolders;
        parentFolders = [];
    }
   
    res.render('indexView', { 
        headerTitle: "MyDrive", 
        rootFolders: rootFolders, 
        files: files, 
        sharedFiles: sharedFiles,
        nestedFolders: nestedFolders, 
        user: req.user, 
        parentFolders: parentFolders
    });
}

module.exports = { indexGet };