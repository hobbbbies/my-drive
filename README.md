# MyDrive  

**MyDrive** is a secure cloud storage platform built with **Express.js** and **Supabase**.  
It was created as a personal project to deepen my understanding of **Node.js**, routing, authentication, database security, and file storage.  

Inspired by services like Google Drive, MyDrive allows users to **create, read, update, and delete (CRUD)** both files and folders in a familiar hierarchy. What sets it apart is its strong focus on **security and data ownership**:  

- **Row Level Security (RLS)** ensures that every file and folder can only be accessed by its rightful owner (or those explicitly granted access).  
- **Optional Client-Side Encryption** adds an extra layer of protection by encrypting files in the browser before they’re uploaded, making sure only the user ever has the key.  

Together, these features guarantee that your data remains **private, encrypted, and fully under your control**.  

🔗 **Live Demo:** [https://my-drive.up.railway.app/](https://my-drive.up.railway.app/) 

---

## 🗂️ Features  

- **CRUD Operations** for both files and folders
- **Client Side Encrpytion** optional for any file 
- **Secure Authentication** using Supabase Auth  
- **Cloud Storage** with Supabase Storage & RLS protection  
- **Authorization Middleware** to protect user content  
- **Folder & File Hierarchy** for easy organization  
- **User-friendly interface** for browsing and managing uploads  

---

## 🔒 Security  
### RLS 
MyDrive uses **Supabase Row Level Security (RLS)** to ensure that users can only access their own files and folders.  
This is achieved by creating database policies that check the authenticated user's `auth.uid()` against the `userid` column in each table.

**Key points:**
- Every file and folder record includes a `userid` field.
- All read, write, update, and delete operations are restricted to the owner or users with share access.
- Without a valid session or JWT, access is denied at the database level.
- Even if an endpoint is exposed, RLS prevents unauthorized data access.

### Client-Side Encryption
MyDrive offers an option to encrypt files **before they are uploaded**. This ensures that even if Supabase storage is compromised, only encrypted data is stored, and the original file remains secure. Encryption is performed in the browser using the **AES-GCM** algorithm, with the encryption key generated and retained solely on the client side.  

Because MyDrive never stores or transmits the key, only the user has the ability to decrypt their files. This means that security depends entirely on the user maintaining control of their keys—if lost, access to the encrypted files cannot be recovered.

**Key points:**
- Users can choose to enable encryption at the time of upload.  
- The encryption key is generated and stored only in the browser’s memory/cache.  
- MyDrive servers and Supabase have **no knowledge of the key** and cannot decrypt files.  
- To download and access encrypted files, users must provide the correct key.  
- Keys are short-lived in the browser; users are responsible for securely saving them to avoid permanent data loss.  

Below is a video demonstrating the upload, encryption, navigation, and download features of MyDrive: 

https://github.com/user-attachments/assets/3843de4f-f063-4e8f-8067-3f12cda3c1b0

---

## 🛠 Tech Stack  

- **Backend:** Express.js, Node.js  
- **Auth & Storage:** Supabase Auth & Supabase Storage  
- **Database:** Prisma ORM (initially), migrated to Supabase for integrated auth/storage  
- **Deployment:** Railway  

---

## 📖 Development Journey  

This project started as a learning exercise with:  
- **Prisma ORM** for database management  
- **Passport.js** for authentication  

Over time, I migrated to **Supabase** for a more streamlined setup, combining authentication, storage, and security in one service. This not only simplified the codebase but also made it **more scalable and secure**.  

---

## 🚀 Getting Started  

### 1. Clone the repository  

```bash
git clone https://github.com/your-username/mydrive.git
cd mydrive
```

### 2. Install Dependencies & Configure Environment Variables

```bash
npm install
```

Create a `.env` file in the project root:

```env
PORT="port_for_server"
SECRET="secret_for_express_sessions"
SUPABASE_DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@<HOST>:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://<DB_USER>:<DB_PASSWORD>@<HOST>:5432/postgres"
SUPABASE_API_KEY="<YOUR_SUPABASE_API_KEY>"
SUPABASE_URL="https://<YOUR_PROJECT_REF>.supabase.co"
```

### 3. Run localhost

```bash
node app.js
```
