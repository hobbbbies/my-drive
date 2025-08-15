const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

async function forgotPasswordGet(req, res) {
    res.render('forgotView');
}

async function forgotPasswordPost(req, res) {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.render('forgotView', { 
                error: 'Email is required' 
            });
        }
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password`
        });
        
        if (error) {
            console.error('Password reset error:', error);
            return res.render('forgotView', { 
                error: 'Unable to send reset email. Please try again.' 
            });
        }
        
        res.render('forgotView', { 
            success: 'If an account with that email exists, we\'ve sent you a password reset link.' 
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.render('forgotView', { 
            error: 'An error occurred. Please try again.' 
        });
    }
}

async function resetPasswordGet(req, res) {
    try {
        // The tokens come as URL fragments, not query params
        // We need to render the page and let JavaScript extract them
        res.render('resetView', { 
            extractTokensFromFragment: true 
        });
    } catch (error) {
        console.error('Reset password get error:', error);
        res.render('forgotView', { 
            error: 'An error occurred. Please try again.' 
        });
    }
}

async function resetPasswordPost(req, res) {
    try {
        const { password, confirmPassword, access_token, refresh_token } = req.body;
        
        if (!password || !confirmPassword) {
            return res.render('resetView', { 
                error: 'Both password fields are required',
                access_token,
                refresh_token
            });
        }
        
        if (password !== confirmPassword) {
            return res.render('resetView', { 
                error: 'Passwords do not match',
                access_token,
                refresh_token
            });
        }
        
        if (password.length < 6) {
            return res.render('resetView', { 
                error: 'Password must be at least 6 characters long',
                access_token,
                refresh_token
            });
        }
        
        // Set the session with the tokens
        const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token
        });
        
        if (sessionError) {
            console.error('Session error:', sessionError);
            return res.render('resetView', { 
                error: 'Invalid or expired reset link',
                access_token,
                refresh_token
            });
        }
        
        // Update the password
        const { error } = await supabase.auth.updateUser({
            password: password
        });
        
        if (error) {
            console.error('Password update error:', error);
            return res.render('resetView', { 
                error: 'Unable to update password. Please try again.',
                access_token,
                refresh_token
            });
        }
        
        res.render('loginView', { 
            success: 'Password updated successfully. Please sign in with your new password.' 
        });
    } catch (error) {
        console.error('Reset password post error:', error);
        res.render('forgotView', { 
            error: 'An error occurred. Please try again.',
            access_token: req.body.access_token,
            refresh_token: req.body.refresh_token
        });
    }
}

module.exports = {
    forgotPasswordGet,
    forgotPasswordPost,
    resetPasswordGet,
    resetPasswordPost
};