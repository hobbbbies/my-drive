const fs = require('fs');
require('dotenv').config();

async function indexGet(req, res) {
    const { data: folders, error: folderError } = await req.supabaseClient.from('Folder').select().eq('userid', req.user.id);
    const folderid = req.params.folderid || null;
    
    // Get user's own files
    const { data: files, error: fileError } = await getUserFiles(req.supabaseClient, req.user.id, folderid);
    
    console.log('userid: ', req.user.id);
    console.log('folderid: ', folderid);
    // Get shared files
    const { data: sharedFiles, error: sharedFileError } = await getSharedFiles(req.supabaseClient, req.user.id, folderid);
    
    // Get shared folders
    const { data: allSharedFolders, error: allSharedError } = await getAllSharedFolders(req.supabaseClient, req.user.id);
    const currentSharedFolders = filterSharedFoldersByParent(allSharedFolders, folderid);

    if (folderError || fileError || sharedFileError || allSharedError) {
        console.error("Database errors:", { folderError, fileError, sharedFileError, allSharedError });
        return res.status(500).send("Server error");
    }

    let nestedFolders;
    let chosenFolder = null;
    let parentFolders = [];
    
    const rootFolders = folders.filter((folder) => folder.parentid === null);
    const allAccessibleFolders = [...folders, ...(allSharedFolders || [])];
    
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

// Helper functions
async function getUserFiles(supabaseClient, userId, folderid) {
    const baseQuery = supabaseClient
        .from('File')
        .select()
        .eq('userid', userId);
    // Refactor this ugly shit
    return folderid 
        ? baseQuery.eq('folderid', folderid)
        : baseQuery.is('folderid', null);
}

async function getSharedFiles(supabaseClient, userId, folderid) {
    const { data: sharedFileRecords, error } = await supabaseClient
        .from('SharedFiles')
        .select(`
            *,
            File:file_path (
                *
            ),
            User:shared_by (
                email,
                name
            )
        `)
        .eq('shared_with', userId);

    if (error) {
        return { data: null, error };
    }

    if (!sharedFileRecords) {
        return { data: [], error: null };
    }

    // Split files into two categories
    const regularSharedFiles = [];
    const rootPromotedFiles = [];

    sharedFileRecords.forEach(record => {
        const file = record.File;
        if (!file) return;

        if (record.shareParents) {
            // Files with shareParents always go to root
            rootPromotedFiles.push(record);
        } else {
            // Regular shared files follow normal folder structure
            regularSharedFiles.push(record);
        }
    });

    // Filter based on current location
    let filteredFiles = [];

    if (!folderid) {
        // In root: show root files + promoted files
        const rootFiles = regularSharedFiles.filter(record => 
            record.File.folderid === null
        );
        filteredFiles = [...rootFiles, ...rootPromotedFiles];
    } else {
        // In folder: only show regular files in this folder
        filteredFiles = regularSharedFiles.filter(record => 
            record.File.folderid === folderid
        );
    }
    console.log("SHARED FILES BEFORE FILTERING: ", sharedFileRecords);
    console.log("SHARED FILES AFTER FILTERING: ", filteredFiles);
    return { data: filteredFiles, error: null };
}

async function getAllSharedFolders(supabaseClient, userId) {
    return supabaseClient
        .from('Folder')
        .select(`
            *,
            User:userid (
                email,
                name
            )
        `)
        .overlaps('shared_with', [userId]);
}

function filterSharedFoldersByParent(allSharedFolders, folderid) {
    if (!allSharedFolders) return [];
    
    return folderid
        ? allSharedFolders.filter(folder => folder.parentid === folderid)
        : allSharedFolders.filter(folder => folder.parentid === null);
}

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
