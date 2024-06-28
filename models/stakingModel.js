import mongoose from 'mongoose';

const stakeTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nacAmount: { type: Number, required: true },
  daiAmount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, default: 'Stake' }, // Stake type for differentiation
});

const StakeTransaction = mongoose.model('StakeTransaction', stakeTransactionSchema);

const unstakeTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, default: 'Unstake' }, // Unstake type for differentiation
});

const UnstakeTransaction = mongoose.model('UnstakeTransaction', unstakeTransactionSchema);

const stakingConfigurationSchema = new mongoose.Schema({
  nacRewardPercentage: { type: Number, default: 0.20 }, // 20%
  daiRewardPercentage: { type: Number, default: 0.05 }, // 5%
  daiEarningDays: { type: Number, default: 30 },
  duration: { type: Number, default: 30 }, // duration in days
  referralPercentage: {type: Number, default: 0.10} // 10%
});

const StakingConfiguration = mongoose.model('StakingConfiguration', stakingConfigurationSchema);

export { UnstakeTransaction, StakeTransaction, StakingConfiguration };
