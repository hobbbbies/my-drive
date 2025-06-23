const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function indexGet(req, res) {
    const accessToken = req.session?.supabase?.access_token;
    let supabase;
    if (accessToken) {
        supabase = createClient(accessToken);
    } else {
        return res.render("loginView", { error: "Invalid access token" });
    }
    const folders = await supabase.from('Folder').select();
    let files = await supabase.from('File').select();
    const rootFolders = folders.data.filter((folder) => folder.parentId === null);
    res.render('indexView', { headerTitle: "MyDrive", folders: folders, files: files.data, nestedFolders: rootFolders, user: req.user });
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

// WIP function
// async function downloadFile(req, res) {
//   try {
//     const fileId = req.params.id;
    
//     // Get file from database
//     const file = await prisma.file.findUnique({
//       where: { id: fileId }
//     });
    
//     if (!file) {
//       return res.status(404).send('File not found');
//     }
    
//     // Construct file path
//     const filePath = path.join(__dirname, '..', 'uploads', file.storagePath || file.name);
    
//     // Check if file exists
//     if (!fs.existsSync(filePath)) {
//       return res.status(404).send('File not found on disk');
//     }
    
//     // Set headers for file download
//     res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    
//     // Stream file to response
//     const fileStream = fs.createReadStream(filePath);
//     fileStream.pipe(res);
//   } catch (error) {
//     console.error('Download error:', error);
//     res.status(500).send('Error downloading file');
//   }
// }

module.exports = { indexGet, fileDelete };