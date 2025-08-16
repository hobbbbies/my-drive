const { createClient } = require('@supabase/supabase-js');
const { createUserClient } = require('../middleware/createClient');
const fs = require('fs');
require('dotenv').config();

async function indexGet(req, res) {
    const { data: folders, error: folderError } = await req.supabaseClient.from('Folder').select();
    const folderid = req.params.folderid;
    
    if (folderid) {
        var { data: files, error: fileError } = await req.supabaseClient
                                                    .from('File')
                                                    .select()
                                                    .eq('folderid', folderid);
    } else {
        var { data: files, error: fileError } = await req.supabaseClient
                                                    .from('File')
                                                    .select()
                                                    .is('folderid', null);
    }
    
    if (folderError || fileError) {
        console.error("folderGet error: ", folderError);
        console.error("fileGet error: ", fileError);
        return res.status(500).send("Server error");
    }

    // Function to build parent folder path
    function buildParentPath(currentFolderId, allFolders) {
        const path = [];
        let currentId = currentFolderId;
        
        while (currentId) {
            const folder = allFolders.find(f => f.id === currentId);
            if (!folder) break;
            
            path.unshift({ // Add to beginning of array
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
        parentFolders = []; // Empty at root level
    }
   
    res.render('indexView', { 
        headerTitle: "MyDrive", 
        rootFolders: rootFolders, 
        files: files, 
        nestedFolders: nestedFolders, 
        user: req.user, 
        parentFolders: parentFolders
    });
}

module.exports = { indexGet };