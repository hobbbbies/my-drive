require("dotenv").config();
const path = require("path");
const shareFile = require('../helpers/shareFile');
const deleteFile = require('../helpers/deleteFile');

// Function to sanitize filename
function sanitizeFilename(filename) {
  return filename.replace(/[^\w\s.-]/g, ""); // Remove special characters except word chars, spaces, dots, hyphens
}

async function filePost(req, res) {
  try {
    const file = req.file;
    const ext = path.extname(file.originalname);
    const originalBaseName = path.basename(file.originalname, ext);

    // Sanitize the filename
    const baseName = sanitizeFilename(originalBaseName);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const uniqueFileName = `${baseName}-${uniqueSuffix}${ext}`;

    let folder = "";
    if (req.body.folder) {
      try {
        folder = JSON.parse(req.body.folder);
      } catch (error) {
        folder = "";
      }
    }

    const { error: uploadError } = await req.supabaseClient.storage
      .from("uploads")
      .upload(uniqueFileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return res.status(400).send("Error uploading file to storage");
    }

    // Then insert into database
    const { error: dbError } = await req.supabaseClient.from("File").insert({
      name: originalBaseName,
      size: file.size,
      extension: ext,
      unique_fname: uniqueFileName, 
      folderid: folder.id || null,
      userid: req.user.id,
      iv: req.body.iv // already stringified from the body 
    });

    if (dbError) {
      console.error("Database insert error:", dbError);

      // Clean up the uploaded file
      await req.supabaseClient.storage.from("uploads").remove([unique_fname]);

      return res.status(400).send("Error saving file information");
    }

    res.redirect("/");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Something went wrong with file upload");
  }
}

async function fileGet(req, res) {
  try {
    const { data, error } = await req.supabaseClient
          .from("Folder")
          .select()
          .eq('userid', req.user.id);

    if (error) {
      console.error("Error getting folders: ", error.message);
      return res.status(500).send("Error getting folders");
    }

    res.render("uploadView", { folders: data, user: req.user });
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.render("uploadView", { folders: [] });
  }
}

async function fileDelete(req, res) {
  console.log('req.query: ', req.query);
  try {
    const shared = req.query.shared === 'true';
    if (!shared) {
      // Deleting own file - remove file completely
      const { data: fileInfo, error: fetchError } = await req.supabaseClient
        .from("File")
        .select("unique_fname")
        .eq("unique_fname", req.query.uniqueFileName)
        .single();

      if (fetchError || !fileInfo) {
        console.error("Error fetching file info: ", fetchError);
        return res.status(404).send("File not found");
      }
      await deleteFile(req.supabaseClient, fileInfo.unique_fname, req.user.id);
    } else {
      // Removing shared file - only remove the share record for this user
      const { error: removeShareError } = await req.supabaseClient
        .from("SharedFiles")
        .delete()
        .eq("file_name", req.query.uniqueFileName)
        .eq("shared_with", req.user.id);

      if (removeShareError) {
        console.error("Error removing shared file: ", removeShareError.message);
        return res.status(400).send("Error removing file from shared list");
      }
    }
    
    const referrer = req.get("Referer") || "/";
    res.redirect(referrer);
  } catch (error) {
    console.error("Error in fileDelete:", error);
    res.status(500).send("Error deleting file");
  }
}

async function fileDownload(req, res) {
  try {
    const { data: fileInfo, error: fetchError } = await req.supabaseClient
      .from("File")
      .select("name, extension, unique_fname, iv")
      .eq("unique_fname", req.query.uniqueFileName)
      .single();

    if (fetchError || !fileInfo) {
      console.error("Error fetching file info: ", fetchError);
      return res.status(404).send("File not found");
    }

    const { data, error } = await req.supabaseClient.storage
      .from("uploads")
      .download(fileInfo.unique_fname);

    

    if (error) {
      console.error("Error downloading file: ", error.message);
      return res.status(500).send("Error downloading file from storage");
    }
    
    const buffer = Buffer.from(await data.arrayBuffer());
    const filename = `${fileInfo.name}${fileInfo.extension}`;
    
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("X-File-IV", fileInfo.iv); // Custom header for IV
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error downloading file");
  }
}

async function fileShare(req, res) {
  try {
    const { itemId: uniqueFileName, email, permissions} = req.body;

    // Validate input
    if (!uniqueFileName || !email) {
      return res
        .status(400)
        .json({ error: "Missing required fields" });
    }

    // Find user by email to get their UUID
    const { data: userData, error: userError } = await req.supabaseClient
      .from("User")
      .select("id")
      .eq("email", email)
      .single();

    if (userError || !userData) {
      console.error("Error finding user by email:", userError);
      return res
        .status(404)
        .json({ error: "User not found with this email address" });
    }

    // Use the helper function
    const result = await shareFile(
      req.supabaseClient, 
      req.user.id, 
      uniqueFileName, 
      userData.id, 
      permissions, 
      false
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Both new shares and already-shared cases are successful
    res.status(200).json({
      message: result.message,
      sharedWith: email,
      alreadyShared: result.alreadyShared || false
    });

  } catch (error) {
    console.error("Share file error:", error);
    res.status(500).json({ error: "Error sharing file" });
  }
}

module.exports = { fileGet, filePost, fileDownload, fileDelete, fileShare };
