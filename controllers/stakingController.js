import User from '../models/user.js';
import stakingConfig from '../config/stakingConfig.js';

const calculateMonthlyRewards = (amount) => {
  return amount * stakingConfig.monthlyDaiRewardPercentage;
};

const calculateDailyRewards = (amount) => {
  return amount * stakingConfig.dailyNacRewardPercentage;
};

const stakingController = {
    stake: async (req, res) => {
      const { amount } = req.body;
      const userId = req.user._id;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      user.stakes.push({
        amount,
        startDate: new Date(),
        duration: stakingConfig.stakingDuration
      });
      user.AmountStaked += amount;
      await user.save();
  
      res.status(200).json({ message: "Stake added successfully" });
    },
  
    unstake: async (req, res) => {
        const userId = req.user._id;
    
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
    
        const now = new Date();
        let totalUnstaked = 0;
        let totalDaiProfits = 0;
    
        user.stakes = user.stakes.filter(stake => {
          const endDate = new Date(stake.startDate);
          endDate.setDate(endDate.getDate() + stake.duration);
    
          if (now >= endDate) {
            // Calculate the duration staked in months
            const monthsStaked = Math.floor((now - new Date(stake.startDate)) / (1000 * 60 * 60 * 24 * 30));
            totalDaiProfits += calculateMonthlyRewards(stake.amount, monthsStaked);
            totalUnstaked += stake.amount;
            return false; // Remove this stake from the array
          }
    
          return true; // Keep this stake
        });
    
        user.NacBalance += totalUnstaked;
        user.DaiBalance += totalDaiProfits;
        user.AmountStaked -= totalUnstaked;
        await user.save();
    
        res.status(200).json({ message: "Unstaked successfully", totalUnstaked, totalDaiProfits });
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
      
  
    claimDailyReward: async (req, res) => {
      const userId = req.user._id;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const now = new Date();
      let totalNacRewards = 0;
  
      user.stakes.forEach(stake => {
        const daysStaked = Math.floor((now - new Date(stake.startDate)) / (1000 * 60 * 60 * 24));
        if (!stake.dailyNacClaimed && daysStaked > 0) {
          const rewards = calculateDailyRewards(stake.amount) * daysStaked;
          totalNacRewards += rewards;
          stake.dailyNacClaimed = true;
        }
      });
  
      user.NacBalance += totalNacRewards;
      await user.save();
  
      res.status(200).json({ message: "Daily rewards claimed successfully", totalNacRewards });
    },
  
    claimMonthlyReward: async (req, res) => {
      const userId = req.user._id;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const now = new Date();
      let totalDaiRewards = 0;
  
      user.stakes.forEach(stake => {
        const monthsStaked = Math.floor((now - new Date(stake.startDate)) / (1000 * 60 * 60 * 24 * 30));
        if (!stake.monthlyDaiClaimed && monthsStaked > 0) {
          const rewards = calculateMonthlyRewards(stake.amount) * monthsStaked;
          totalDaiRewards += rewards;
          stake.monthlyDaiClaimed = true;
        }
      });
  
      user.DaiBalance += totalDaiRewards;
      await user.save();
  
      res.status(200).json({ message: "Monthly rewards claimed successfully", totalDaiRewards });
    },
  
    updateStakingDuration: async (req, res) => {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
  
      const { newDuration } = req.body;
      if (newDuration <= 0) {
        return res.status(400).json({ message: "Invalid duration value" });
      }
  
      stakingConfig.stakingDuration = newDuration;
      res.status(200).json({ message: "Staking duration updated successfully" });
    },
  
    getStakingConfig: async (req, res) => {
      res.status(200).json({
        monthlyDaiRewardPercentage: stakingConfig.monthlyDaiRewardPercentage,
        dailyNacRewardPercentage: stakingConfig.dailyNacRewardPercentage,
        stakingDuration: stakingConfig.stakingDuration
      });
    },
  
    getUserStakes: async (req, res) => {
      const userId = req.user._id;
  
      const user = await User.findById(userId).select('stakes');
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json({ stakes: user.stakes });
    }
  };
  
  export default stakingController;
  
  
