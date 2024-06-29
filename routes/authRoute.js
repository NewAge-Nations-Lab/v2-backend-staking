//authRoute.js
import express from "express";
import authController from "../controllers/authController.js";




const router = express.Router();

// Welcome message
router.get("/", (req, res) => {
  res.json({ message: "Welcome Newage coin json file" });
});

router.get("/check-auth", authController.checkAuth);




// Logout route
router.get("/logout", authController.logout);


// Registration and login routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify/:userId", authController.verify);






export default router;
