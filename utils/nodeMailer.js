import 'dotenv/config.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'newagecoin.cash',
  port: 465,
  auth: {
    user: 'noreply@newagecoin.cash',
    pass: 'J]2X8Ouu8&^h', // Password set directly here
  },
});

// Verify SMTP configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP configuration error:');
    console.error(error);
  } else {
    console.log("SMTP configuration is correct. Server is ready to take our messages.");
  }
});

export const sendVerificationEmail = async (to, code) => {
  const mailOptions = {
    from: '"Newage" <noreply@newagecoin.cash>', // Updated line
    to,
    subject: 'Newage Verification Code',
    text: `Dear User,\n\nYour verification code is: ${code}\n\nThank you for choosing Newage.\n\nBest regards,\nThe Newage Team`,
  };

  return transporter.sendMail(mailOptions);
};

export const sendStakeNotification = async (to, nacAmount, daiAmount, daiRewardPercentage) => {
  const mailOptions = {
    from: '"Newage" <noreply@newagecoin.cash>', // Updated line
    to,
    subject: 'NAC Staking Confirmation',
    text: `Dear User,\n\nWe are pleased to inform you that you have successfully staked ${nacAmount} NAC. Additionally, ${daiAmount} DAI has been automatically staked on your behalf.\n\nYou will receive ${daiRewardPercentage * 100}% of the staked DAI amount as rewards every month for the duration of the staking period.\n\nThank you for choosing Newage.\n\nBest regards,\nThe Newage Team`,
  };

  return transporter.sendMail(mailOptions);
};

export const sendUnstakeNotification = async (to, amount, currency) => {
  const mailOptions = {
    from: '"Newage" <noreply@newagecoin.cash>', // Updated line
    to,
    subject: 'NAC Unstake Confirmation',
    text: `Dear User,\n\nThis email confirms that you have successfully unstaked ${amount} ${currency}.\n\nPlease note that you will no longer receive DAI rewards for this unstaked amount.\n\nThank you for choosing Newage.\n\nBest regards,\nThe Newage Team`,
  };

  return transporter.sendMail(mailOptions);
};

export const sendForgetPasswordEmail = async (to, token) => {
  const resetLink = `http://${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: '"Newage" <noreply@newagecoin.cash>', // Updated line
    to,
    subject: 'Password Reset',
    text: `You have requested a password reset. Please click the following link to reset your password: ${resetLink}`,
    html: `<p>You have requested a password reset. Please click the following link to reset your password:</p>
           <a href="${resetLink}">Reset Password</a>`,
  };

  return transporter.sendMail(mailOptions);
};
