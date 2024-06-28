//authcontroller
import passport from "passport";
import User from "../models/user.js";
import { sendVerificationEmail } from "../utils/nodeMailer.js";
import { generateVerificationCode } from "../utils/verficationCodeGenerator.js";





const authController = {

  register: async (req, res) => {
    try {
      const { username, email, password, phone, referralCode } = req.body;

      // Generate verification code
      const verificationCode = generateVerificationCode();

      // Create a new user instance
      const newUser = new User({
        username,
        email,
        phone,
        verificationCode,
        referralCode: username // Update referralCode with the new user's username
      });

      // Handle referral
      if (referralCode) {
        // Find the referring user
        const referringUser = await User.findOne({ referralCode: referralCode });

        if (referringUser) {
          newUser.referrer = referringUser._id; // Assign the referrer's ID to the newUser
          referringUser.referrals.push(newUser);
          await referringUser.save();
        } else {
          console.log(`Referring user not found for referralCode: ${referralCode}`);
          return res.status(400).json({ message: `Referring user not found for referralCode: ${referralCode}` });
        }
      }

      // Register the user
      User.register(newUser, password, async (err, user) => {
        if (err) {
          // Handle registration errors
          console.error(err);
          if (err.name === 'UserExistsError') {
            return res.status(400).json({ message: 'User already registered' });
          } else {
            return res.status(500).json({ message: 'Internal Server Error' });
          }
        }

        // Send verification code via email
        try {
          await sendVerificationEmail(user.email, verificationCode);
        } catch (emailError) {
          console.error('Error sending verification email:', emailError);
          // Handle email sending error
          return res.status(500).json({ message: 'Error sending verification email' });
        }

        passport.authenticate('local')(req, res, () => {
          res.status(200).json({ 
            message: `Verification code sent to ${user.email}`, 
            redirectTo: "/verify",
            userId: user._id,
            email: user.email,
            referral: user.referralCode // Return the updated referralCode
          });
        });
      });
    } catch (error) {
      console.error('Error during registration:', error);
      return res.status(500).json({ message: 'Unexpected error during registration' });
    }
  },



  login: async (req, res) => {


    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      if (!user) {
        return res.status(401).json({ message: 'Authentication failed' });
      }
      req.logIn(user, async (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
        // Prepare the response data
        const responseData = {
          message: 'Successfully logged in',
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            isVerified: { status: user.isVerified, message: "for email verification" },
          },
        };
        res.status(201).json(responseData);
      });
    })(req, res);
  },

  checkAuth: async (req, res) => {
    if (req.user) {
      res.status(201).json({ loggedIn: true, user: req.user });
    } else {
      res.status(201).json({ loggedIn: false });
    }
  },
  
  


  logout: async function (req, res) {
    // Check if the user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      // Logout the user
      req.logout((err) => {
        if (err) {
          console.log(err);
        } else {
          res.status(200).json({ message: "Successfully logged out" });
        }
      });
    } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },



  // Verify 
 // Verify 
 // authController.js

verify: async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from request params
    const { verifyCode } = req.body; // Extract verification code from request body

   

    // Find the user by userId
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Check if the verification code matches the one in the database
    if (user.verificationCode !== verifyCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Update user's verification status
    user.isVerified = true;
    user.verificationCode = 'verified'; //clear the code after successful verification
    await user.save();

    // Return success response
    return res.status(201).json({
      message: 'Email Verified Successfully, you can login into your account now'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unexpected error during verification' });
  }
},






};

export default authController;