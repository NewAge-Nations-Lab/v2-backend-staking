// userRoutes.js
import express from "express";
import userController from "../controllers/userController.js";
import { ensureAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// Welcome message
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Newage coin user route" });
});

// Route to get referrals
router.get("/referrals/:userId", ensureAuthenticated, userController.getReferrals);

// Route to get referral code
router.get("/referral-code/:userId", ensureAuthenticated, userController.getReferralName);

// Get user profile
router.get("/profile/:userId", ensureAuthenticated, userController.getProfile);

// Other routes...
router.put("/updateProfile/:userId", ensureAuthenticated, userController.upDateprofile);
router.post("/reset-password/:userId", ensureAuthenticated, userController.resetPassword);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPasswordWithToken);

export default router;
