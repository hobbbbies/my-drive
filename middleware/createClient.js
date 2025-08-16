const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Service role client for admin operations
const adminClient = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_API_KEY
);

// Function to create a client with user token
function createUserClient(token) {
    return createClient(
        process.env.SUPABASE_URL, 
        process.env.SUPABASE_API_KEY, 
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
            global: {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            }
        }
    );
}

module.exports = { adminClient, createUserClient };