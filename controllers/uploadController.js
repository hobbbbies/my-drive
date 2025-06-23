const {createClient} = require('@supabase/supabase-js');
require('dotenv').config();
const path = require('path');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY); 

async function uploadPost(req, res) {
    try {
        const file = req.file
        const ext = path.extname(file.originalname); // Get original file extension
        const baseName = path.basename(file.originalname, ext);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const uniqueFileName = `${baseName}-${uniqueSuffix}${ext}`;

        const { data: { user } } = await supabase.auth.getUser(req.session.supabase.access_token);
        const userId = user ? user.id : null;
        
        let folder = "";
        if (req.body.folder) {
            try {
                folder = JSON.parse(req.body.folder)
            } catch(error) {
                folder = "";
            }
        }
        const folderName = folder ? folder.name : ""

        const { data, error: uploadError } = await supabase
            .storage
            .from('uploads') // Replace with your actual bucket name
            .upload(`${folderName}/${uniqueFileName}`, file.buffer);
            
        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            return res.status(400).send("Error uploading file to storage");
        }

        const { error } = await supabase
            .from('File')
            .insert({ 
                name: baseName,
                size: file.size,
                extension: ext,
                storagePath: `${folderName}/${uniqueFileName}`,
                folderId: folder.id || null,
                userid: userId,
             })
        if (error) return res.status(400).send("erorr with supabase insert");
        res.redirect("/");
    } catch(error) {
        console.error(error);
        return res.status(500).send("Something went wrong with file upload");
    }
}

async function uploadGet(req, res) {
    try {
        const { data, error } = await supabase
            .from('Folder')
            .select()

        res.render('uploadView', { folders: data });
    } catch (error) {
        console.error("Error fetching folders:", error);
        res.render('uploadView', { folders: [] });
    }
}

module.exports = { uploadGet, uploadPost };