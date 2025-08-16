
const {createUserClient} = require('./createClient');

async function attachClient(req, res, next) {
    const accessToken = req.session?.supabase?.access_token;
    if (accessToken) {
        req.supabaseClient = createUserClient(accessToken);
        next();
    } else {
        return res.render("loginView", { error: "Invalid access token" });
    }
}

module.exports = attachClient;
