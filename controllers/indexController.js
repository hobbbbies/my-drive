const fs = require('fs');
require('dotenv').config();

async function keysGet(req, res) {
    try {
        const { data: folders, error: folderError } = await req.supabaseClient.from('Folder').select().eq('userid', req.user.id);
        res.render('keyView', { folders, user: req.user });
        if (folderError) {
            console.error("Error fetching folders:", folderError);
            return res.status(500).send("Error fetching folders");
        }
    } catch (error) {
        console.error("Error fetching folders:", error);
        return res.status(500).send("Error fetching folders");
    }
}


async function indexGet(req, res) {
    // get users own folders
    const { data: folders, error: folderError } = await req.supabaseClient.from('Folder').select().eq('userid', req.user.id);
    const folderid = req.params.folderid || null;
    
    // Get user's own files
    const { data: files, error: fileError } = await getUserFiles(req.supabaseClient, req.user.id, folderid);
    // Get shared files
    const { data: sharedFiles, error: sharedFileError } = await getSharedFiles(req.supabaseClient, req.user.id, folderid);
    
    // Get shared folders
    const { data: sharedFolders, error: sharedFolderError } = await getSharedFolders(req.supabaseClient, req.user.id, folderid);

    if (folderError || fileError || sharedFileError || sharedFolderError) {
        console.error("Database errors:", { folderError, fileError, sharedFileError, sharedFolderError });
        return res.status(500).send("Server error");
    }

    let nestedFolders;
    let chosenFolder = null;
    let parentFolders = [];
    
    const rootFolders = folders.filter((folder) => folder.parentid === null);
    const sharedFolderObjs = (sharedFolders.sharedFolderRecords || []).map(r => r.Folder);
    const allAccessibleFolders = [...folders, ...sharedFolderObjs];    
    
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
        sharedFolders: sharedFolders.filteredFolders,
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
            File:file_name (
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

        if (!record.share_parents) {
            // Files with shareParents always go to root
            rootPromotedFiles.push(record);
        } else {
            // Regular shared files follow normal folder structure
            regularSharedFiles.push(record);
        }
    });

    // Filter based on current path
    let filteredFiles = [];

    if (!folderid) {
        // In root: show root files + promoted files
        const rootFiles = regularSharedFiles.filter(record => 
            record.File.folderid === null
        );
        filteredFiles = [...rootFiles, ...rootPromotedFiles];
    } else {
        filteredFiles = regularSharedFiles.filter(record => 
            record.File.folderid === folderid
        );
    }

    return { data: filteredFiles, error: null };
}

async function getSharedFolders(supabaseClient, userId, folderid) {
    const { data: sharedFolderRecords, error } = await supabaseClient
        .from('SharedFolders')
        .select(`
            *,
            Folder:folderid (
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

    if (!sharedFolderRecords) {
        return { data: [], error: null };
    }

    // Split folders into two categories
    const regularSharedFolders = [];
    const rootPromotedFolders = [];

    sharedFolderRecords.forEach(record => {
        const folder = record.Folder;
        if (!folder) return;
        
        if (!record.share_parents) {
            // Folders without share_parents always go to root
            rootPromotedFolders.push(record);
        } else {
            // Regular shared folders follow normal folder structure
            regularSharedFolders.push(record);
        }
    });

    // Filter based on current location
    let filteredFolders = [];

    if (!folderid) {
        // In root: show root folders + promoted folders
        const rootFolders = regularSharedFolders.filter(record => 
            record.Folder.parentid === null
        );
        filteredFolders = [...rootFolders, ...rootPromotedFolders];
    } else {
        // In folder: only show regular folders in this folder
        filteredFolders = regularSharedFolders.filter(record => 
            record.Folder.parentid === folderid
        );
    }
    return { data: { sharedFolderRecords, filteredFolders }, error: null };
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

module.exports = { indexGet, keysGet };
