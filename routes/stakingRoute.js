import express from "express";
import stakingController from "../controllers/stakingController.js";
import { ensureAuthenticated, ensureAdmin } from "../middleware/authMiddleWare.js";

const router = express.Router();

router.post("/:userId", stakingController.stake);
router.post("/unstake/:userId", stakingController.unstake);
router.post("/withdraw", stakingController.withdraw);
router.post("/claim-nac-reward/:userId", stakingController.claimNacReward);
router.post("/claim-dai-reward/:userId", stakingController.claimDaiReward); // claim dai monthly reward
router.put("/update-staking-config", stakingController.updateStakingConfig);
router.get("/staking-config", stakingController.getStakingConfig);
router.get("/user-stakes/:userId", stakingController.getUserStakes);
router.get("/available-nac-reward/:userId", stakingController.getAvailableNacReward);
router.get("/available-dai-reward/:userId", stakingController.getAvailableDaiReward);



export default router;
