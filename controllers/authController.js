import jwt from "jsonwebtoken";
import prisma from "../prisma/prisma.js";
import md5 from "md5";
// import sendOtpViaSMS from "../utils/sendOtpViaSms.js";

import {
  randomNumber,
  randomString,
  timeCreate,
  isNumber,
  ipAddress,
} from "./../utils/randomGenerate.js";
import {
  generateAndStoreOTP,
  memoryCache,
  sendOtpViaEmail,
} from "../utils/sendOtpViaEmail.js";
import { failedResponse } from "../utils/response.js";

export const login = async (req, res, next) => {
  const { email, password: pwd } = req.body;
  if (!email || !pwd) {
    return res.status(400).json({
      message: "Bad Request: Missing required parameters",
      status: false,
    });
  }
  // if (email.length < 9 || email.length > 10 || !isNumber(email)) {
  //   return res.status(400).json({
  //     message: "email error",
  //     status: false,
  //   });
  // }

  try {
    const user = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "incorrect email or Password",
        status: false,
      });
    }

    // Use md5 to hash the password
    const hashedPassword = md5(pwd);
    if (hashedPassword === user.password) {
      const accessToken = jwt.sign(
        {
          email: email,
        },
        process.env.JWT_ACCESS_TOKEN,
        { expiresIn: "365d" }
      );

      await prisma.users.updateMany({
        where: {
          email: email,
        },
        data: {
          token: accessToken,
        },
      });

      return res.status(200).json({
        message: "Login Success",
        status: true,
        token: accessToken,
        value: accessToken,
      });
    } else {
      return res.status(401).json({
        message: "incorrect email or Password",
        status: false,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
};

export const register = async (req, res, next) => {
  // let { pwd, invitecode, otp, email, name, phone } = req.body;
  let { pwd, invitecode, email, name, phone } = req.body;
  invitecode = invitecode || null;
  phone = String(phone);
  let id_user = randomNumber(10000, 99999);
  let name_user = name;
  let code = randomString(5) + randomNumber(10000, 99999);
  let ip = ipAddress(req);
  let time = timeCreate();
  if (!email || !pwd) {
    return res.status(400).json({
      message: "DATA ERROR!!!",
      status: false,
    });
  }
  const password = md5(pwd);
  if (phone.length < 9 || phone.length > 10 || !isNumber(phone)) {
    return res.status(400).json({
      message: "Phone number must be equal to 9 or 10 digits",
      status: false,
    });
  }

  try {
    // const cacheKey = "otp_" + email;
    // const savedOtp = memoryCache.get(cacheKey);
    // if (!savedOtp) {
    //   return failedResponse(res, "Otp Expired!");
    // }
    // if (Number(savedOtp) !== Number(otp)) {
    //   return failedResponse(res, "Invalid Otp");
    // }
    // if (Number(otp) !== 1234) {
    //   return failedResponse(res, "Invalid Otp");
    // }

    const checkUser = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });
    const auser = await prisma.users.findFirst({
      where: {
        phone: String(phone),
      },
    });
    if (auser || checkUser) {
      return res.status(400).json({
        status: false,
        message: "Phone Number or Email Already Regsitered",
      });
    }
    let invitecode1 = "6fGGw42409"; // Default value for no referral code

    if (invitecode && invitecode.trim().length > 0) {
      const checkInvite = await prisma.users.count({
        where: {
          code: invitecode.trim(),
        },
      });

      if (checkInvite === 0) {
        return failedResponse(res, "Invalid Referral Code");
      }

      invitecode1 = invitecode.trim(); // Use the valid referral code
    }

    const referDetails = await prisma.refer.findMany();
    const parentCommission = referDetails[0].parentCommission;
    const notReferCommision = referDetails[0].notReferCommission;
    // const childrenCommission = referDetails[0].childrenCommission;

    let money = 0;
    if (invitecode1 === "6fGGw42409") {
      money = notReferCommision;
    }
    if (invitecode1 !== "6fGGw42409") {
      const parentUser = await prisma.users.findFirst({
        where: { code: invitecode1 },
      });
      let pendingReferralsArray = parentUser.pendingReferrals
        ? JSON.parse(parentUser.pendingReferrals)
        : [];
      pendingReferralsArray.push(email);
      const updatedPendingReferrals = JSON.stringify(pendingReferralsArray);

      if (parentUser) {
        await prisma.users.updateMany({
          where: { code: invitecode1 },
          data: {
            referrals: {
              increment: 1,
            },
            pendingCommission: {
              increment: Number(parentCommission),
            },
            pendingReferrals: updatedPendingReferrals,
          },
        });
        // await prisma.transaction.create({
        //   data: {
        //     points: Number(parentCommission),
        //     type: "d",
        //     cur: "rev",
        //     email: parentUser.email,
        //     receiver: "",
        //     sender: "",
        //     name_user: parentUser.name_user,
        //     phone: parentUser.phone,
        //     token: 0,
        //   },
        // });
      }
    }

    await prisma.users.create({
      data: {
        id_user,
        email,
        name_user,
        password: password,
        money: money,
        code,
        invite: invitecode1,
        veri: 1,
        // otp,
        ip_address: ip,
        status: 1,
        time,
        phone,
      },
    });

    if (Number(money)) {
      await prisma.transaction.create({
        data: {
          points: Number(money),
          type: "d",
          cur: "rev",
          email: email,
          receiver: "Bonus",
          sender: "Bonus",
          name_user: name_user,
          phone: phone,
          token: 0,
        },
      });
    }
    return res.status(200).json({
      message: "Registeration Successfull",
      status: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
};

export const verifyCode = async (req, res, next) => {
  const email = req.body.email;
  if (!email) {
    return failedResponse(res, "Please enter valid Email");
  }
  console.log("line 259");
  const existUser = await prisma.users.findMany({ where: { email: email } });
  if (existUser.length) {
    return failedResponse(res, "Email Already registered");
  }
  console.log("line 264");
  const otp = generateAndStoreOTP(email);
  const now = Date.now();
  const OTP_VALIDITY_DURATION = 2 * 60 * 1000 + 500;
  try {
    await sendOtpViaEmail(email, otp);
    return res.status(200).json({
      message: "Otp sent successfully",
      status: true,
      timeStamp: now,
      timeEnd: now + OTP_VALIDITY_DURATION,
    });
  } catch (error) {
    console.error("Error in verifyCode:", error);
    return res.status(500).json({
      message: "Internal server error",
      status: false,
    });
  }
};

export const verifyCodePass = async (req, res) => {
  let email = req.body.email;
  let now = new Date().getTime();
  let timeEnd = +new Date() + 1000 * (60 * 2 + 0) + 500;
  let otp = randomNumber(100000, 999999);
  try {
    const users = await prisma.users.findMany({
      where: {
        email: email,
      },
    });
    const user = users[0];
    if (!user) {
      return res.status(200).json({
        message: "Account does not exist",
        status: false,
        timeStamp: now,
      });
    }

    if (user.time_otp && new Date(user.time_otp).getTime() - now <= 0) {
      await sendOtpViaEmail(email, otp);
      await prisma.users.updateMany({
        where: {
          email: String(email),
        },
        data: {
          otp: otp,
          time_otp: new Date(timeEnd).toISOString(),
        },
      });
      return res.status(200).json({
        message: "Submitted successfully",
        status: true,
        timeStamp: now,
        timeEnd: timeEnd,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

export const forGotPassword = async (req, res) => {
  let email = req.body.email;
  let otp = req.body.otp;
  let pwd = req.body.pwd;
  let now = new Date().getTime();
  let timeEnd = +new Date() + 1000 * (60 * 2 + 0) + 500;
  let otp2 = randomNumber(100000, 999999);
  try {
    const users = await prisma.users.findMany({
      where: {
        email: email,
      },
    });
    const user = users[0];
    if (!user) {
      return res.status(200).json({
        message: "Account does not exist",
        status: false,
        timeStamp: now,
      });
    }
    if (user.otp == otp) {
      const user = await prisma.users.updateMany({
        where: {
          email: email,
        },
        data: {
          password: md5(pwd),
          otp: otp2,
          time_otp: new Date(timeEnd).toISOString(),
        },
      });
      return res.status(200).json({
        message: "Change password successfully",
        status: true,
        timeStamp: now,
        timeEnd: timeEnd,
      });
    } else {
      return res.status(200).json({
        message: "OTP code is incorrect",
        status: false,
        timeStamp: now,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
};
