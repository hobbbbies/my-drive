# MyDrive  

**MyDrive** is a personal project built with **Express.js** to deepen my understanding of Node.js, routing, authentication, and cloud storage with **Row Level Security (RLS)**.  

It’s a **mock cloud storage platform** — similar in spirit to Google Drive — that lets you **create, read, update, and delete (CRUD)** both **files and folders**, while ensuring everything is **securely protected**.  

🔗 **Live Demo:** [my-drive-qr71.onrender.com](https://my-drive-qr71.onrender.com/) 

---

## 🗂️ Features  

- **CRUD Operations** for both files and folders  
- **Secure Authentication** using Supabase Auth  
- **Cloud Storage** with Supabase Storage & RLS protection  
- **Authorization Middleware** to protect user content  
- **Folder & File Hierarchy** for easy organization  
- **User-friendly interface** for browsing and managing uploads  

---

## 🔒 Security  

MyDrive uses **Supabase Row Level Security (RLS)** to ensure that users can only access their own files and folders.  
This is achieved by creating database policies that check the authenticated user's `auth.uid()` against the `userid` column in each table.

**Key points:**
- Every file and folder record includes a `userid` field.
- All read, write, update, and delete operations are restricted to the owner or users with share access.
- Without a valid session or JWT, access is denied at the database level.
- Even if an endpoint is exposed, RLS prevents unauthorized data access.



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

npm install

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
