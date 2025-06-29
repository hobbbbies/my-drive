const {createClient} = require('@supabase/supabase-js');
require('dotenv').config();
const path = require('path');

async function uploadPost(req, res) {
    try {
        const file = req.file
        const ext = path.extname(file.originalname); // Get original file extension
        const baseName = path.basename(file.originalname, ext);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const uniqueFileName = `${baseName}-${uniqueSuffix}${ext}`;
        const id = crypto.randomUUID();

        let folder = "";
        if (req.body.folder) {
            try {
                folder = JSON.parse(req.body.folder)
            } catch(error) {
                folder = "";
            }
        }
        const folderName = folder ? folder.name : ""

        const { data, error: uploadError } = await req.supabaseClient
            .storage
            .from('uploads') // Replace with your actual bucket name
            .upload(`${folderName}/${id}`, file.buffer);
            
        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            return res.status(400).send("Error uploading file to storage");
        }

        const { error } = await req.supabaseClient
            .from('File')
            .insert({ 
                name: baseName,
                size: file.size,
                extension: ext,
                storagePath: `${folderName}/${uniqueFileName}`,
                folderid: folder.id || null,
                userid: req.user.id,
                id: id,
             })
        if (error) {
            console.error("error with inserting user: ", error);
            return res.status(400).send("error with supabase insert");
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