const { createClient } = require('@supabase/supabase-js');
const { createUserClient } = require('../controllers/createClient');
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

    let nestedFolders;
    const rootFolders = folders.filter((folder) => folder.parentid === null);;
    if (folderid) {
        var { data: chosenFolder} = await req.supabaseClient
                            .from("Folder")
                            .select()
                            .eq('id', folderid)
                            .single();
        nestedFolders = folders.filter((folder) => folder.parentid === folderid);
    } else {
        var chosenFolder = null;
        nestedFolders = rootFolders;
    }
   
    res.render('indexView', { headerTitle: "MyDrive", rootFolders: rootFolders, files: files, nestedFolders: nestedFolders, user: req.user, chosenFolder: chosenFolder });
}

async function fileDelete(req, res) {
    try{
        // First, get the file info from database to get the storage path
        const { data: fileInfo, error: fetchError } = await req.supabaseClient
            .from('File')
            .select('storagePath')
            .eq('storagePath', req.query.storagePath)
            .single();
            
        if (fetchError || !fileInfo) {
            console.error("Error fetching file info: ", fetchError);
            return res.status(404).send("File not found");
        }

        // Delete from database first
        const { error: dbError} = await req.supabaseClient
            .from('File')
            .delete()
            .eq('storagePath', req.query.storagePath);
            
        if (dbError) {
            console.error("Error deleting file from DB: ", dbError.message);
            return res.status(400).send("Error deleting file from database");
        }

        // Delete from storage using the storage path
        const { error: storageError } = await req.supabaseClient
            .storage
            .from('uploads')
            .remove([fileInfo.storagePath]);
            
        if (storageError) {
            console.error("Error deleting from storage: ", storageError.message);
            console.error("Warning: File deleted from DB but not from storage");
        }
        
        const referrer = req.get('Referer') || '/';
        res.redirect(referrer);
    } catch(error) {
        console.error(error);
        res.status(500).send("Error deleting file");
    }
}

async function fileDownload(req, res) {
    try{
        // Get file info from database first
        const { data: fileInfo, error: fetchError } = await req.supabaseClient
            .from('File')
            .select('name, extension, storagePath')
            .eq('storagePath', req.query.storagePath)
            .single();
            
        if (fetchError || !fileInfo) {
            console.error("Error fetching file info: ", fetchError);
            return res.status(404).send("File not found");
        }

        // Download using the stored path
        const { data, error } = await req.supabaseClient
            .storage
            .from('uploads')
            .download(fileInfo.storagePath);
            
        if (error) {
            console.error("Error downloading file: ", error.message);
            return res.status(500).send("Error downloading file from storage");
        }

        const buffer = Buffer.from(await data.arrayBuffer());
        const filename = `${fileInfo.name}${fileInfo.extension}`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type: application/octet-stream');
        res.send(buffer);

    } catch(error) {
        console.error(error);
        res.status(500).send("Error downloading file");
    }
}

module.exports = { indexGet, fileDelete, fileDownload };