import express from "express";
import { ensureAuthenticated, ensureAdmin } from "../utils/authMiddleware.js";

const router = express.Router();

router.get("/protected", ensureAuthenticated, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

router.get("/admin", ensureAdmin, (req, res) => {
  res.json({ message: "This is an admin route", user: req.user });
});

export default router;
