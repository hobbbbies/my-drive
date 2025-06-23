const {createClient} = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY); 

async function userAuth(req, res, next) {
    try {
        // Check if session and token exist before accessing
        if (!req.session || !req.session.supabase || !req.session.supabase.access_token) {
            return res.redirect("/auth/login");
        }
        
        // Get user with token
        const { data, error } = await supabase.auth.getUser(req.session.supabase.access_token);
        
        if (error || !data.user) {
            console.log("Auth error:", error);
            return res.redirect("/auth/login");
        }
    
        // Set user in request for later use if needed
        req.user = data.user;
        req.user.name = req.session.supabase.name ;
        next();
    } catch (error) {
        console.error("Authentication middleware error:", error);
        res.redirect("/auth/login");
    }
}

module.exports = userAuth;