const { createClient } = require('@supabase/supabase-js');
const { createUserClient } = require('../controllers/createClient');
require('dotenv').config();

async function indexGet(req, res) {
    // const accessToken = req.session?.supabase?.access_token;
    // let supabase;
    // if (accessToken) {
    //     supabase = createUserClient(accessToken);
    // } else {
    //     return res.render("loginView", { error: "Invalid access token" });
    // }

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
    if (folderid) {
        const { data: chosenFolder} = await req.supabaseClient
                            .from("Folder")
                            .select()
                            .eq('id', folderid)
                            .single();
        nestedFolders = folders.filter((folder) => folder.parentid === folderid);
    } else {
        nestedFolders = folders.filter((folder) => folder.parentid === null);
    }
   
    res.render('indexView', { headerTitle: "MyDrive", folders: folders, files: files, nestedFolders: nestedFolders, user: req.user });
}

async function fileDelete(req, res) {
    try{
        await prisma.file.delete({
            where: {id: req.query.id}
        });
        const referrer = req.get('Referer') || '/';
        res.redirect(referrer);
    } catch(err) {
        console.error(error);
        res.status(500).send("Error deleting file");
    }
}

module.exports = { indexGet, fileDelete };