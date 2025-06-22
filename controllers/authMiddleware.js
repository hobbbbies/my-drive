const {createClient} = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY); 

async function userAuth(req, res, next) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) next();
    else res.redirect("/auth/login");
}

module.exports = userAuth