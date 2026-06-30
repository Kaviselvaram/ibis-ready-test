import { getServiceSupabase } from "../config/supabase.js";
import { AppError } from "../errors/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Missing or invalid authorization header", 401, "UNAUTHORIZED");
    }

    const token = authHeader.split(" ")[1];
    
    // Verify our custom JWT
    let decoded;
    try {
      decoded = await verifyAccessToken(token);
    } catch(err) {
      require('fs').appendFileSync('/tmp/auth-error.log', "verifyAccessToken error: " + err.message + "\n");
      throw err;
    }
    
    // Get user profile from Supabase using the service role to verify the user exists
    const supabase = getServiceSupabase();
    
    // In our custom JWT, the user ID is in the 'sub' claim
    const userId = decoded.sub;

    // Hydrate profile (In future Phase, use Redis to cache this)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      require('fs').appendFileSync('/tmp/auth-error.log', "Profile error: " + JSON.stringify(profileError) + " Profile: " + !!profile + " for userId " + userId + "\n");
      throw new AppError("User profile not found", 401, "UNAUTHORIZED");
    }

    // Attach user id and profile to request
    req.user = { id: userId, role: decoded.role, plan: decoded.plan };
    req.profile = profile;
    next();
  } catch (error) {
    next(error);
  }
};
