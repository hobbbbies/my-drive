const {createClient} = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

async function signup(req, res) {
    try {
        const { name, email, password } = req.body;
        
        // Pass user metadata including name as options.data
        const { error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                    display_name: name
                }
            }
        });
        
        if (error) {
            console.error("Signup error:", error);
            return res.render('signupView', { error: error.message });
        }

        const { errorLogin } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (errorLogin) {
            console.error("Login error:", error);
            return res.render('signupView', { error: error.message });
        }
        
        // On successful signup
        res.redirect("/");
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).render('signupView', { error: "An unexpected error occurred" });
    }
}

module.exports = { signup };