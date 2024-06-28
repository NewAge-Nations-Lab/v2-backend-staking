// user.js
import mongoose from "mongoose";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  email: { type: String, required: false },
  phone: { type: String, required: false },
  NacBalance: { type: Number, default: 0 },
  DaiBalance: { type: Number, default: 0 },
  stakeCount: { type: Number, default: 0 },
  DaiRewardBalance: { type: Number, default: 0 },
  NacRewardBalance: { type: Number, default: 0 },
  stakes: [{
    nacAmount: Number,
    daiAmount: Number,
    startDate: Date,
    duration: Number, // in days
    dailyNacClaimed: { type: Boolean, default: false },
    monthlyDaiClaimed: { type: Boolean, default: false }
  }],
  isAdmin: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  verificationCode: String,
  referralCode: String,
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // just like the upline
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]  // just like the downlines
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'username' });

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then(user => {
    done(null, user);
  }).catch(err => {
    done(err, null);
  });
});

export default User;
