import nodemailer from "nodemailer";
import NodeCache from "node-cache";

// Create a NodeCache instance with a TTL of 120 seconds and check period of 600 seconds
export const memoryCache = new NodeCache({
  stdTTL: 120, // Default TTL in seconds (2 minutes)
  checkperiod: 60, // Interval in seconds to check for expired keys
  maxKeys: 100000, // Maximum number of keys to store
});

// Function to generate a random OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
}

// Function to generate and store OTP in cache
export function generateAndStoreOTP(userid) {
  const otp = generateOTP();
  const cacheKey = `otp_${userid}`;
  try {
    // Use set method of node-cache
    memoryCache.set(cacheKey, otp, 120); // Store OTP with TTL of 120 seconds
  } catch (err) {
    console.error("Error storing OTP in cache:", err);
  }
  return otp;
}

export async function sendOtpViaEmail(recipient, otp) {
  let transporter = nodemailer.createTransport({
    host: "smtp.smtp.com",
    port: 465,
    secure: true, // false for TLS
    auth: {
      user: "random", // Your email address
      pass: "abcd", // Your email password
    },
    headers: {
      "Reply-To": "support@example.com",
    },
  });

  try {
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
          <h1>OTP for Verification</h1>
          <p>Your One-Time Password (OTP) is:</p>
          <div class="otp-box">
            <h2 class="otp">OTP: ${otp}</h2>
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

    let mailOptions = {
      from: "support@example.com",
      to: recipient,
      subject: "OTP for Revoride Game",
      html: htmlContent,
    };

    transporter.verify(function (error, success) {
      if (error) {
        console.log("SMTP Connection Error:", error);
      } else {
        console.log("Server is ready to send emails");
      }
    });
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
    console.error("Error sending email:", error);
  }
}
