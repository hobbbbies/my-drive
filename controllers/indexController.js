const fs = require('fs');
require('dotenv').config();

async function indexGet(req, res) {
    const { data: folders, error: folderError } = await req.supabaseClient.from('Folder').select();
    const folderid = req.params.folderid;
    
    // Get user's own files using destructuring
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

    // Get shared files (files shared with current user) - FILTERED BY FOLDER
    const { data: sharedFiles, error: sharedFileError } = folderid
        ? await req.supabaseClient
            .from('File')
            .select(`
                *,
                User:userid (
                    email,
                    name
                )
            `)
            .eq('folderid', folderid)
            .overlaps('shared_with', [req.user.id])
        : await req.supabaseClient
            .from('File')
            .select(`
                *,
                User:userid (
                    email,
                    name
                )
            `)
            .is('folderid', null)
            .overlaps('shared_with', [req.user.id]);

    // Get ALL shared folders (for path building) - NOT filtered by parent
    const { data: allSharedFolders, error: allSharedError } = await req.supabaseClient
        .from('Folder')
        .select(`
            *,
            User:userid (
                email,
                name    
                )
            `)
        .overlaps('shared_with', [req.user.id]);

    // Get shared folders at current level (for display) - FILTERED BY PARENT
    const currentSharedFolders = folderid
        ? allSharedFolders?.filter(folder => folder.parentid === folderid) || []
        : allSharedFolders?.filter(folder => folder.parentid === null) || [];

    if (folderError || fileError || sharedFileError || allSharedError) {
        console.error("Database errors:", { folderError, fileError, sharedFileError, allSharedError });
        return res.status(500).send("Server error");
    }

    let nestedFolders;
    let chosenFolder = null;
    let parentFolders = [];
    
    // Filter folders to only show user's own folders
    const userFolders = folders.filter(folder => folder.userid === req.user.id);
    const rootFolders = userFolders.filter((folder) => folder.parentid === null);
    
    // Get ALL folders accessible to user (owned + shared) for path building
    const allAccessibleFolders = [...userFolders, ...(allSharedFolders || [])];
    
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
        nestedFolders = userFolders.filter((folder) => folder.parentid === folderid);
        
        // Use allAccessibleFolders for path building (includes all shared folders)
        parentFolders = buildParentPath(folderid, allAccessibleFolders);
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
        currentSharedFolders: currentSharedFolders,
        user: req.user, 
        parentFolders: parentFolders
    });
}

// Function to build parent folder path - now works with both owned and shared folders
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

module.exports = { indexGet };
