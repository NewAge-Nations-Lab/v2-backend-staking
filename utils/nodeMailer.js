//utils/nodeMailer.js
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
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP configuration error:');
    console.error(error);
  } else {
    console.log("SMTP configuration is correct. Server is ready to take our messages.");
  }
});

export const sendVerificationEmail = async (to, code) => {
  const mailOptions = {
    from: 'noreply@newagecoin.cash',
    to,
    subject: 'Newage Verification Code',
    text: `Dear User,\n\nYour verification code is: ${code}\n\nThank you for choosing Newage.\n\nBest regards,\nThe Newage Team`,
  };

  return transporter.sendMail(mailOptions);
};

// utils/nodeMailer.js
export const sendStakeNotification = async (to, nacAmount, daiAmount, daiRewardPercentage) => {
  const mailOptions = {
    from: 'noreply@newagecoin.cash',
    to,
    subject: 'NAC Staking Confirmation',
    text: `Dear User,\n\nWe are pleased to inform you that you have successfully staked ${nacAmount} NAC. Additionally, ${daiAmount} DAI has been automatically staked on your behalf.\n\nYou will receive ${daiRewardPercentage * 100}% of the staked DAI amount as rewards every month for the duration of the staking period.\n\nThank you for choosing Newage.\n\nBest regards,\nThe Newage Team`,
  };

  return transporter.sendMail(mailOptions);
};


export const sendUnstakeNotification = async (to, amount, currency) => {
  const mailOptions = {
    from: 'noreply@newagecoin.cash',
    to,
    subject: 'NAC Unstake Confirmation',
    text: `Dear User,\n\nThis email confirms that you have successfully unstaked ${amount} ${currency}.\n\nPlease note that you will no longer receive DAI rewards for this unstaked amount.\n\nThank you for choosing Newage.\n\nBest regards,\nThe Newage Team`,
  };

  return transporter.sendMail(mailOptions);
};

export const sendForgotPasswordEmail = async (to, resetLink) => {
  const mailOptions = {
    from: 'noreply@newagecoin.cash',
    to,
    subject: 'Password Reset Request',
    text: `Dear User,\n\nPlease click on the following link, or paste this into your browser to reset your password: ${resetLink}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n\nThank you for choosing Newage.\n\nBest regards,\nThe Newage Team`,
  };

  return transporter.sendMail(mailOptions);
};
