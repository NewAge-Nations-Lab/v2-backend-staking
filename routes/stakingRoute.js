import express from "express";
import stakingController from "../controllers/stakingController.js";
import { ensureAuthenticated, ensureAdmin } from "../middleware/authMiddleWare.js";

const router = express.Router();

router.post("/:userId", ensureAuthenticated, stakingController.stake);
router.post("/unstake/:userId", ensureAuthenticated, stakingController.unstake);
router.post("/withdraw", ensureAuthenticated, stakingController.withdraw);
router.post("/claim-nac-reward/:userId", ensureAuthenticated, stakingController.claimNacReward);
router.post("/claim-dai-reward/:userId", ensureAuthenticated, stakingController.claimDaiReward); // claim dai monthly reward
router.put("/update-staking-config", ensureAuthenticated, ensureAdmin, stakingController.updateStakingConfig);
router.get("/staking-config", ensureAuthenticated, stakingController.getStakingConfig);
router.get("/user-stakes", ensureAuthenticated, stakingController.getUserStakes);

export default router;
