const {createClient} = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

async function loginPost (req, res) {
    try {
        const { email, password } = req.body;
        
        // Pass user metadata including name as options.data
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) {
            console.error("Login error:", error);
            return res.render('loginView', { error: error.message });
        }

        const { data: nameData, error: nameError} = await supabase
                                            .from('User')
                                            .select('name')
                                            .eq('id', data.user.id)
                                            .maybeSingle();

        if (nameError) {
            console.error("error fetching user:", nameError);
            return res.render('loginView', { error: nameError.message });
        }

        req.session.supabase = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            name: nameData.name
        }
        
        // On successful login
        res.redirect("/");
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).render('loginView', { error: "An unexpected error occurred" });
    } 
}

async function logout (req, res, next) {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Server error:", error);
        res.status(500).render('loginView', { error: "An unexpected error occurred" });
    }
    req.session.supabase = {
        access_token: null,
        refresh_token: null,
    }
    next()
}

module.exports = { loginPost, logout };