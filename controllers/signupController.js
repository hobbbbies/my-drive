const {createClient} = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

async function signup(req, res) {
    try {
        const { name, email, password } = req.body;
        
        // Pass user metadata including name as options.data
        const { data, error } = await supabase.auth.signUp({
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

        // const { error: insertError } = await supabase
        // .insert
        // .from('User')
        // .insert({ id: data.session.user.id, name: name, email: email});

        // const { errorLogin } = await supabase.auth.signInWithPassword({
        //     email: email,
        //     password: password,
        // });

        // if (errorLogin) {
        //     console.error("Login error:", errorLogin);
        //     return res.render('signupView', { error: errorLogin.message });
        // }

        req.session.supabase = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            name: name,
        }
                
        // On successful signup
        res.redirect("/");
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).render('signupView', { error: "An unexpected error occurred" });
    }
}

module.exports = { signup };