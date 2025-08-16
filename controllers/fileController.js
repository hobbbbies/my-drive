const {createClient} = require('@supabase/supabase-js');
require('dotenv').config();
const path = require('path');

// Function to sanitize filename
function sanitizeFilename(filename) {
    return filename
        .replace(/[^\w\s.-]/g, '') // Remove special characters except word chars, spaces, dots, hyphens
}

async function filePost(req, res) {
    try {
        const file = req.file
        const ext = path.extname(file.originalname);
        const originalBaseName = path.basename(file.originalname, ext);
        
        // Sanitize the filename
        const baseName = sanitizeFilename(originalBaseName);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const uniqueFileName = `${baseName}-${uniqueSuffix}${ext}`;

        let folder = "";
        if (req.body.folder) {
            try {
                folder = JSON.parse(req.body.folder)
            } catch(error) {
                folder = "";
            }
        }

        const folderName = folder ? folder.name : ""
        const storagePath = folderName ? `${folderName}/${uniqueFileName}` : uniqueFileName;

        const { error: uploadError } = await req.supabaseClient
            .storage
            .from('uploads')    
            .upload(storagePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
        });
        
        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            return res.status(400).send("Error uploading file to storage");
        }

        // Then insert into database
        const { error: dbError } = await req.supabaseClient
            .from('File')
            .insert({ 
                name: originalBaseName, 
                size: file.size,
                extension: ext,
                storagePath: storagePath, // Only store storagePath
                folderid: folder.id || null,
                userid: req.user.id
             });
             
        if (dbError) {
            console.error("Database insert error:", dbError);
            
            // Clean up the uploaded file
            await req.supabaseClient
                .storage
                .from('uploads')
                .remove([storagePath]);
                
            return res.status(400).send("Error saving file information");
        }

        res.redirect("/");
    } catch(error) {
        console.error(error);
        return res.status(500).send("Something went wrong with file upload");
    }
}

async function fileGet(req, res) {
    try {
        const { data, error } = await req.supabaseClient
            .from('Folder')
            .select()

        res.render('uploadView', { folders: data, user: req.user });
    } catch (error) {
        console.error("Error fetching folders:", error);
        res.render('uploadView', { folders: [] });
    }
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


module.exports = { fileGet, filePost, fileDownload, fileDelete };