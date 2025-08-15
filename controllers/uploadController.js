const {createClient} = require('@supabase/supabase-js');
require('dotenv').config();
const path = require('path');

// Function to sanitize filename
function sanitizeFilename(filename) {
    return filename
        .replace(/[^\w\s.-]/g, '') // Remove special characters except word chars, spaces, dots, hyphens
        .replace(/\s+/g, '_')      // Replace spaces with underscores
        .replace(/_{2,}/g, '_')    // Replace multiple underscores with single
        .trim();                   // Remove leading/trailing whitespace
}

async function uploadPost(req, res) {
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

        const { data, error: uploadError } = await req.supabaseClient
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
                // mimetype: file.mimetype,
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

async function uploadGet(req, res) {
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

module.exports = { uploadGet, uploadPost };