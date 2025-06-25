const {createClient} = require('@supabase/supabase-js');
const { createUserClient } = require('../controllers/createClient');
require('dotenv').config();
const path = require("path");

async function folderPost (req, res) {
    try {
        const { folderName, folder: parentId } = req.body;
        const userid = req.user.id;
        const { error: folderError} = await req.supabaseClient
                            .from('Folder')
                            .insert({ name: folderName, parentid: parentId, userid: userid });
           
        if (folderError) {
            console.error("Error creating folder in database:", folderError);
            return res.status(500).send("Error creating folder");
        }

        const { error: storageError} = await req.supabaseClient
            .storage
            .from('uploads') 
            .upload(folderName);

        if (storageError) {
            console.error("Error creating folder in storage:", storageError);
            res.status(500).send("Error uploading folder into storage");
        }

        res.redirect("/");
  } catch (error) {
        console.error("Server error: ", error);
        res.status(500).json({ error: error.message });
  }
}

async function folderCreateGet(req, res) {
    try {
        const { data: folders, error} = await req.supabaseClient
                            .from('Folder')
                            .select();
        if (error) {
            console.log("Error getting folders: ", error);
            res.status(500).json({ error: error.message });
        }
        res.render('folderCreateView', { folders: folders });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
}

async function folderDelete(req, res) {
    try{
        const response = await req.supabaseClient.from('Folder').delete().eq('id', req.query.id);
        if (response.error) {
            console.error("Error deleting folder: ", response.error.message);
            res.status(500).send("Error deleting folder on the DB side.");
        }
        const referrer = req.get('Referer') || '/';
        res.redirect(referrer);
    } catch(error) {
        console.error(error);
        res.status(500).send("Error deleting folder");
    }
}

module.exports = { folderPost, folderCreateGet, folderDelete }