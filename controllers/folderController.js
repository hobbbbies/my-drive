const {createClient} = require('@supabase/supabase-js');
const { createUserClient } = require('../controllers/createClient');
require('dotenv').config();
const path = require("path");

async function folderPost (req, res) {
    const accessToken = req.session?.supabase?.access_token;
    let supabase;
    if (accessToken) {
        supabase = createUserClient(accessToken);
    } else {
        return res.render("loginView", { error: "Invalid access token" });
    }

    try {
        const { folderName, folder: parentId } = req.body;
        const userid = req.user.id;
        const { error: folderError} = await supabase
                            .from('Folder')
                            .insert({ name: folderName, parentid: parentId, userid: userid });
           
        if (folderError) {
            console.error("Error creating folder in database:", folderError);
            return res.status(500).send("Error creating folder");
        }

        const { error: storageError} = await supabase
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
    const accessToken = req.session?.supabase?.access_token;
    let supabase;
    if (accessToken) {
        supabase = createUserClient(accessToken);
    } else {
        return res.render("loginView", { error: "Invalid access token" });
    }

    try {
        const { data: folders, error} = await supabase
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

async function folderGet(req, res) {
    const folders = await prisma.folder.findMany({});
    let files = await prisma.file.findMany({});
    const folderId = req.params.folderId;
    const chosenFolder = await prisma.folder.findUnique({
        where: { id: folderId}
    })

    files = files.filter((file) => {
        return file.folderId === folderId
    });

    const nestedFolders = folders.filter((folder) => folder.parentId === chosenFolder.id);

    res.render('indexViews', { headerTitle: chosenFolder.name, folders: folders, files: files, nestedFolders: nestedFolders });
}

module.exports = { folderGet, folderPost, folderCreateGet }