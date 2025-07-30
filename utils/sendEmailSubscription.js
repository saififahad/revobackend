import nodemailer from "nodemailer";
// Create a transporter using the SMTP server configuration
const transporter = nodemailer.createTransport({
  host: "send.smtp.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: "revoridegame",
    pass: "2025-1Million$", // The password for the email account
  },
});

let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP for Verification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .card {
        background-color: #ffffff;
        border-radius: 10px;
        box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
        padding: 30px;
        text-align: center;
      }
      h1 {
        color: #333333;
        margin-bottom: 20px;
      }
      h2{
        color: #333333;
        margin-bottom: 20px;
        font-size: 24px;
      }
      p {
        color: #666666;
        font-size: 16px;
        margin-bottom: 10px;
      }
      .otp-box {
        background-color: #eeeeee;
        border-radius: 8px;
        padding: 20px;
        margin-top: 20px;
        text-align: center;
      }
      .otp {
        font-size: 36px;
        color: #333333;
        margin: 0;
      }
      .highlight {
        font-size: 18px;
        font-weight: bold;
        margin: 15px 0;
        color: #333333;
      }
      .footer {
        margin-top: 20px;
        font-size: 14px;
        color: #999999;
      }
    </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <h1>Subscription Notification</h1>
          <div class="otp-box">
            <h2 class="otp">Subscribed to Revoride Game</h2>
          </div>
          <h2>Out of Gas: A Ride You’ll Want to Take Again and Again!</h2>
          <p class="highlight">Buckle up!</p>
          <p>🚗 <strong>Fast-Paced Gameplay:</strong> Every second counts as you race against the fuel gauge.</p>
          <p>⛽ <strong>High Stakes, Bigger Rewards:</strong> The farther you go, the bigger the payout—but will you risk it all?</p>
          <p>🔥 <strong>Interactive Experience:</strong> Visual fuel gauge lets you track your progress and winnings in real-time.</p>
          <p>🎮 <strong>Doug at the Wheel:</strong> Drive alongside Doug, a fan-favorite character who’s as cool under pressure as you need to be.</p>
          <p>💰 <strong>Bet, Drive, Win:</strong> Place your bets, hit the gas, and cash out before it’s too late!</p>
        </div>
      </div>
    </body>
    </html>
    `;
// Function to send an email
export const sendSubscriptionEmail = (userEmail, subscriptionDate) => {
  const supportEmailBody = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Subscription Notification</title>
    <style>
      body { font-family: Arial, sans-serif; }
      .container { padding: 20px; border: 1px solid #ddd; background: #f9f9f9; }
      .header { font-size: 24px; margin-bottom: 10px; }
      .content { margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">New Subscription Notification</div>
      <div class="content">
        <p>A new user has subscribed to Revoride Game. Here are the details:</p>
        <table>
          <tr>
            <td>User Email:</td>
            <td>${userEmail}</td>
          </tr>
          <tr>
            <td>Subscription Date:</td>
            <td>${subscriptionDate}</td>
          </tr>
        </table>
      </div>
    </div>
  </body>
  </html>
  `;

  // Send email to the support team
  const supportMailOptions = {
    from: "support@revoridegame.com",
    to: "support@revoridegame.com", // recipient email
    subject: "New Subscription Received",
    html: supportEmailBody,
  };

  // Send email to the user
  const userMailOptions = {
    from: "support@revoridegame.com",
    to: userEmail, // The user's email
    subject: "Subscription Successful",
    html: htmlContent,
  };

  //   Send both emails
  transporter.sendMail(supportMailOptions, (error, info) => {
    if (error) {
      console.log("Error sending support email:", error);
    } else {
      console.log("Support email sent:", info.response);
    }
  });

  transporter.sendMail(userMailOptions, (error, info) => {
    if (error) {
      console.log("Error sending user email:", error);
    } else {
      console.log("User email sent:", info.response);
    }
  });
};
