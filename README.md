# MyDrive  

**MyDrive** is a personal project built with **Express.js** to deepen my understanding of Node.js, routing, authentication, and cloud storage with **Row Level Security (RLS)**.  

It’s a **mock cloud storage platform** — similar in spirit to Google Drive — that lets you **create, read, update, and delete (CRUD)** both **files and folders**, while ensuring everything is **securely protected**.  

🔗 **Live Demo:** [my-drive-qr71.onrender.com](https://my-drive-qr71.onrender.com/) *(may take up to a minute to load)*  

---

## ✨ Features  

- **CRUD Operations** for both files and folders  
- **Secure Authentication** using Supabase Auth  
- **Cloud Storage** with Supabase Storage & RLS protection  
- **Authorization Middleware** to protect user content  
- **Folder & File Hierarchy** for easy organization  
- **User-friendly interface** for browsing and managing uploads  

---

## 🔒 Security  

- **Supabase Row Level Security (RLS)** ensures that uploaded files are accessible only to their owners.  
- All operations are protected via **auth middleware**.  
- No public access to stored files unless explicitly shared.  

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

git clone https://github.com/your-username/mydrive.git
cd mydrive

### 2. Install Dependencies & Configure Environment Variables

npm install

Create a `.env` file in the project root:

```env
# Supabase configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Service role key for admin-only server tasks (NEVER expose to client)
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App configuration
PORT=3000
NODE_ENV=development
SESSION_SECRET=your_random_session_secret


### 3. Run localhost

node app.js

## 🔒 Row Level Security (RLS)

MyDrive uses **Supabase Row Level Security (RLS)** to ensure that users can only access their own files and folders.  
This is achieved by creating database policies that check the authenticated user's `auth.uid()` against the `owner_id` column in each table.

**Key points:**
- Every file and folder record includes an `owner_id` field.
- All read, write, update, and delete operations are restricted to the owner.
- Without a valid session or JWT, access is denied at the database level.
- Even if an endpoint is exposed, RLS prevents unauthorized data access.

