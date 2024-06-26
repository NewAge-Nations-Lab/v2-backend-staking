import express from "express";
import stakingController from "../controllers/stakingController.js";
import { ensureAuthenticated, ensureAdmin } from "../middleware/authMiddleWare.js";

const router = express.Router();

router.post("/stake", ensureAuthenticated, stakingController.stake);
router.post("/unstake", ensureAuthenticated, stakingController.unstake);
router.post("/withdraw", ensureAuthenticated, stakingController.withdraw);
router.post("/claim-daily-reward", ensureAuthenticated, stakingController.claimDailyReward);
router.post("/claim-monthly-reward", ensureAuthenticated, stakingController.claimMonthlyReward);
router.post("/update-staking-duration", ensureAuthenticated, ensureAdmin, stakingController.updateStakingDuration);
router.get("/staking-config", ensureAuthenticated, stakingController.getStakingConfig);
router.get("/user-stakes", ensureAuthenticated, stakingController.getUserStakes);

export default router;
