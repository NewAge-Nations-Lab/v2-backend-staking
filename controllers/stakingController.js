import User from "../models/user.js";
import axios from 'axios';
import { sendStakeNotification, sendUnstakeNotification } from '../utils/nodeMailer.js';
import { StakeTransaction, UnstakeTransaction, StakingConfiguration } from '../models/stakingModel.js';





const calculateDaiRewards = (daiAmount, daiRewardPercentage, daysStaked, daiEarningDays) => {
  if (!daiAmount || isNaN(daiAmount) || !daiRewardPercentage || isNaN(daiRewardPercentage) || !daysStaked || isNaN(daysStaked) || !daiEarningDays || isNaN(daiEarningDays)) {
    return 0; // Return 0 or handle the error appropriately
  }
  const reward = (daiAmount * daiRewardPercentage * daysStaked) / daiEarningDays;
  return isNaN(reward) ? 0 : reward; // Ensure the reward is a valid number
};


const calculateNacRewards = (nacAmount, nacRewardPercentage) => {
  if (!nacAmount || isNaN(nacAmount) || !nacRewardPercentage || isNaN(nacRewardPercentage)) {
    return 0; // Return 0 or handle the error appropriately
  }
  const reward = nacAmount * nacRewardPercentage;
  return isNaN(reward) ? 0 : reward; // Ensure the reward is a valid number
};


const stakingController = {
  stake: async (req, res) => {
    const { nacAmount } = req.body;
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const stakingConfig = await StakingConfiguration.findOne();
    if (!stakingConfig) {
      return res.status(500).json({ message: "Staking configuration not found" });
    }

    
    let nacPriceUSD;

    try {
      const response = await axios.get('https://api.dexscreener.com/latest/dex/tokens/0xa486a99109d21ac204a2219c8e40fb0733afec88');
      nacPriceUSD = parseFloat(response.data.pairs[0].priceUsd);
      
      if (nacPriceUSD) {
        // Update staking configuration with the new price
        stakingConfig.nacPriceUSD = nacPriceUSD;
        await stakingConfig.save();
      }
    } catch (error) {
      console.error("Error fetching NAC price:", error);
      nacPriceUSD = stakingConfig.nacPriceUSD; // Fallback to the saved price
    }

    let daiAmount = nacAmount * nacPriceUSD;

    

    const isFirstStake = user.stakeCount === 0;

    user.stakes.push({
      nacAmount,
      daiAmount,
      startDate: new Date(),
      duration: stakingConfig.duration
    });

    user.stakeCount += 1;

    await user.save();

    if (isFirstStake && user.referrer) {
      const referrer = await User.findById(user.referrer);
      if (referrer) {
        const referralBonus = nacAmount * stakingConfig.referralPercentage;
        referrer.NacBalance += referralBonus; // Assuming referral bonus is given in NAC
        await referrer.save();
      }
    }

    const stakeTransaction = new StakeTransaction({
      userId: user._id,
      nacAmount,
      daiAmount,
      nacPriceUSD,
    });
    await stakeTransaction.save();

    await sendStakeNotification(user.email, nacAmount, daiAmount, stakingConfig.daiRewardPercentage);

    res.status(200).json({ message: "Stake added successfully" });
  },

  unstake: async (req, res) => {
    try {
      const userId = req.params.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const now = new Date();
      let totalUnstakedNac = 0;
      let totalUnstakedDai = 0;

      const newStakes = [];
      for (const stake of user.stakes) {
        const endDate = new Date(stake.startDate);
        endDate.setDate(endDate.getDate() + stake.duration);

        if (now >= endDate) {
          totalUnstakedNac += stake.nacAmount;
          totalUnstakedDai += stake.daiAmount;

          const unstakeTransactionNac = new UnstakeTransaction({
            userId: user._id,
            amount: stake.nacAmount,
            date: now,
            currency: 'NAC',
          });
          await unstakeTransactionNac.save();

          const unstakeTransactionDai = new UnstakeTransaction({
            userId: user._id,
            amount: stake.daiAmount,
            date: now,
            currency: 'DAI',
          });
          await unstakeTransactionDai.save();

          await sendUnstakeNotification(user.email, stake.nacAmount, 'NAC');
          await sendUnstakeNotification(user.email, stake.daiAmount, 'DAI');
        } else {
          newStakes.push(stake);
        }
      }

      user.stakes = newStakes;
      user.NacBalance += totalUnstakedNac;
      user.DaiBalance += totalUnstakedDai;
      await user.save();

      res.status(200).json({ message: "Unstaked successfully", totalUnstakedNac, totalUnstakedDai });
    } catch (error) {
      console.error("Error during unstake:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  withdraw: async (req, res) => {
    const { amount, currency } = req.body; // currency should be 'NAC' or 'DAI'
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currency === 'DAI') {
      if (user.DaiBalance < amount) {
        return res.status(400).json({ message: "Insufficient DAI balance" });
      }

      user.DaiBalance -= amount;
    } else if (currency === 'NAC') {
      if (user.NacBalance < amount) {
        return res.status(400).json({ message: "Insufficient NAC balance" });
      }

      user.NacBalance -= amount;
    } else {
      return res.status(400).json({ message: "Invalid currency type" });
    }

    await user.save();

    res.status(200).json({ message: "Withdrawal successful", amount, currency });
  },

  claimNacReward: async (req, res) => {
    try {
      const userId = req.params.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const stakingConfig = await StakingConfiguration.findOne();
      if (!stakingConfig) {
        return res.status(500).json({ message: "Staking configuration not found" });
      }

      const now = new Date();
      let totalNacRewards = 0;

      user.stakes.forEach(stake => {
        const daysStaked = Math.floor((now - new Date(stake.startDate)) / (1000 * 60 * 60 * 24));
        if (!stake.dailyNacClaimed && daysStaked > 0) {
          const rewards = calculateNacRewards(stake.nacAmount, stakingConfig.nacRewardPercentage) * daysStaked;
          
          // Check if rewards is a valid number
          if (isNaN(rewards)) {
            return res.status(400).json({ message: "Invalid rewards calculation" });
          }

          totalNacRewards += rewards;
          stake.dailyNacClaimed = true;
        }
      });

      // Check if totalNacRewards is a valid number
      if (isNaN(totalNacRewards)) {
        return res.status(400).json({ message: "Invalid rewards calculation" });
      }

      user.NacBalance = (user.NacBalance || 0) + totalNacRewards; // Ensure NacBalance is a number

      // Check if the updated NacBalance is a valid number
      if (isNaN(user.NacBalance)) {
        return res.status(400).json({ message: "Invalid balance calculation" });
      }

      await user.save();

      res.status(200).json({ message: "Daily rewards claimed successfully", totalNacRewards });
    } catch (error) {
      console.error("Error claiming NAC rewards:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAvailableNacReward: async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const stakingConfig = await StakingConfiguration.findOne();
      if (!stakingConfig) {
        return res.status(500).json({ message: "Staking configuration not found" });
      }
  
      const now = new Date();
      let totalNacRewards = 0;
  
      user.stakes.forEach(stake => {
        const daysStaked = Math.floor((now - new Date(stake.startDate)) / (1000 * 60 * 60 * 24));
        if (!stake.dailyNacClaimed && daysStaked > 0) {
          totalNacRewards += calculateNacRewards(stake.nacAmount, stakingConfig.nacRewardPercentage) * daysStaked;
        }
      });
  
      res.status(200).json({ availableNacRewards: totalNacRewards });
    } catch (error) {
      console.error("Error fetching available NAC rewards:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  
  getAvailableDaiReward: async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const stakingConfig = await StakingConfiguration.findOne();
      if (!stakingConfig) {
        return res.status(500).json({ message: "Staking configuration not found" });
      }
  
      const now = new Date();
      let totalDaiRewards = 0;
  
      user.stakes.forEach(stake => {
        const daysStaked = Math.floor((now - new Date(stake.startDate)) / (1000 * 60 * 60 * 24));
        if (daysStaked >= stakingConfig.daiEarningDays && !stake.monthlyDaiClaimed) {
          totalDaiRewards += calculateDaiRewards(stake.daiAmount, stakingConfig.daiRewardPercentage, daysStaked, stakingConfig.daiEarningDays);
        }
      });
  
      res.status(200).json({ availableDaiRewards: totalDaiRewards });
    } catch (error) {
      console.error("Error fetching available DAI rewards:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  claimDaiReward: async (req, res) => {
    try {
      const userId = req.params.userId;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const stakingConfig = await StakingConfiguration.findOne();
      if (!stakingConfig) {
        return res.status(500).json({ message: "Staking configuration not found" });
      }

      const now = new Date();
      let totalDaiRewards = 0;

      user.stakes.forEach(stake => {
        const daysStaked = Math.floor((now - new Date(stake.startDate)) / (1000 * 60 * 60 * 24));
        if (daysStaked >= stakingConfig.daiEarningDays && !stake.monthlyDaiClaimed) {
          const rewards = calculateDaiRewards(stake.daiAmount, stakingConfig.daiRewardPercentage, daysStaked, stakingConfig.daiEarningDays);
          totalDaiRewards += rewards;
          stake.monthlyDaiClaimed = true;
        }
      });

      // Check if totalDaiRewards is a valid number
      if (isNaN(totalDaiRewards)) {
        return res.status(400).json({ message: "Invalid rewards calculation" });
      }

      user.DaiBalance = (user.DaiBalance || 0) + totalDaiRewards; // Ensure DaiBalance is a number

      // Check if the updated DaiBalance is a valid number
      if (isNaN(user.DaiBalance)) {
        return res.status(400).json({ message: "Invalid balance calculation" });
      }

      await user.save();

      res.status(200).json({ message: "DAI rewards claimed successfully", totalDaiRewards });
    } catch (error) {
      console.error("Error claiming DAI rewards:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  

  updateStakingConfig: async (req, res) => {
    try {
      const { nacRewardPercentage, daiRewardPercentage, daiEarningDays, duration, referralPercentage } = req.body;

      console.log("Received data for updating staking config:", {
        nacRewardPercentage,
        daiRewardPercentage,
        daiEarningDays,
        duration,
        referralPercentage,
      });

      let stakingConfig = await StakingConfiguration.findOne();
      
      if (!stakingConfig) {
        console.log("Staking configuration not found, initializing new config.");
        stakingConfig = new StakingConfiguration();
      }

      if (nacRewardPercentage !== undefined) stakingConfig.nacRewardPercentage = nacRewardPercentage;
      if (daiRewardPercentage !== undefined) stakingConfig.daiRewardPercentage = daiRewardPercentage;
      if (daiEarningDays !== undefined) stakingConfig.daiEarningDays = daiEarningDays;
      if (referralPercentage !== undefined) stakingConfig.referralPercentage = referralPercentage;
      if (duration !== undefined) stakingConfig.duration = duration;

      await stakingConfig.save();

      console.log("Staking configuration updated successfully:", stakingConfig);
      res.status(200).json({ message: "Staking configuration updated successfully" });
    } catch (error) {
      console.error("Error updating staking configuration:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getStakingConfig: async (req, res) => {
    const stakingConfig = await StakingConfiguration.findOne();
    if (!stakingConfig) {
      return res.status(500).json({ message: "Staking configuration not found" });
    }

    res.status(200).json({
      monthlyDaiRewardPercentage: stakingConfig.daiRewardPercentage,
      dailyNacRewardPercentage: stakingConfig.nacRewardPercentage,
      daiEarningDays: stakingConfig.daiEarningDays,
      duration: stakingConfig.duration,
      referralPercentage: stakingConfig.referralPercentage,
      nacPriceUSD: stakingConfig.nacPriceUSD,
    });
  },

  getUserStakes: async (req, res) => {
    const userId = req.params.userId;

    const user = await User.findById(userId).select('stakes');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ stakes: user.stakes });
  }
};

export default stakingController;
