import prisma from "../prisma/prisma.js";
import catchAsync from "../utils/catchAsync.js";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { getRandomBets } from "../utils/getRandomBets.js";
import { failedResponse, successResponse } from "../utils/response.js";

export const protect = catchAsync(async (req, res, next) => {
  let token;

  // Extract token from headers
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Redirect if no token found
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  let decoded;
  try {
    // Validate JWT token
    decoded = await promisify(jwt.verify)(token, process.env.JWT_ACCESS_TOKEN);
  } catch (error) {
    console.error("JWT Error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(500).json({ message: "Authentication failed" });
  }

  // Find current user in database
  const currentUser = await prisma.users.findFirst({
    where: { email: decoded.email },
  });

  if (!currentUser) {
    return res.status(401).json({ message: "User not found" });
  }

  // Fetch reference details
  const referDetails = await prisma.refer.findFirst({
    where: { id: 1 },
    select: {
      privatekey: false,
      id: true,
      usdt: true,
      rev: true,
      mwa: true,
      address: true,
      mda: true,
    },
  });

  // Get parent user if invite code exists
  let parentUser = [];
  if (currentUser.invite) {
    parentUser = await prisma.users.findFirst({
      where: { code: currentUser.invite },
    });
  }

  // Attach user data to request object
  req.user = { ...currentUser, ...referDetails, parentUser };
  req.email = decoded.email;
  req.phone = currentUser.phone;

  next();
});

export const getUserInfo = async (req, res, next) => {
  try {
    return res.status(200).json({
      status: true,
      user: req.user,
    });
  } catch (err) {
    console.log(err);
    return res.status(404).json({
      status: false,
      message: err.message,
    });
  }
};
export const withDraw = async (req, res, next) => {
  try {
    const email = req.email;
    const phone = req.phone;

    const {
      withdrawamount,
      bankName,
      accountNumber,
      upi,
      accountHolderName,
      ifsc,
    } = req.body;
    const user = await prisma.users.findFirst({
      where: {
        email,
      },
    });
    const gender = user.gender;
    const name = user.name;
    if (user) {
      await prisma.withdraw.create({
        data: {
          phone,
          money: Number(withdrawamount),
          account: accountNumber,
          ifsc: ifsc,
          name_bank: bankName,
          name_user: accountHolderName,
          time: Date.now().toString(),
          stk: upi,
          gender,
          name,
        },
      });

      const bank = await prisma.bank.findFirst({
        where: {
          phone,
        },
      });
      if (!bank) {
        await prisma.bank.create({
          data: {
            phone: phone,
            account: accountNumber,
            ifsc: ifsc,
            name_bank: bankName,
            name_user: accountHolderName,
            stk: upi,
            email,
            gender,
            name,
          },
        });
      } else {
        await prisma.bank.updateMany({
          where: {
            phone,
          },
          data: {
            account: accountNumber,
            ifsc: ifsc,
            name_bank: bankName,
            name_user: accountHolderName,
            stk: upi,
          },
        });
      }
      await prisma.users.update({
        where: {
          phone: phone,
        },
        data: {
          money: {
            decrement: Number(withdrawamount),
          },
        },
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "User Not Found!...",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Money Debited successfull!...",
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};
export const transferMoney = async (req, res, next) => {
  try {
    const ownPhone = req.phone;
    const { phone, amount } = req.body;
    if (phone === ownPhone) {
      return res.status(400).json({
        status: false,
        message: "You Can't transfer money in your own account!..",
      });
    }
    const reuser = await prisma.users.findFirst({
      where: {
        phone,
      },
    });
    const seuser = await prisma.users.findMany({
      where: {
        phone: ownPhone,
      },
    });
    if (!reuser || !seuser) {
      return res.status(400).json({
        status: false,
        message: "User Not Found",
      });
    }
    if (Number(seuser.money) < Number(amount)) {
      return res.status(400).json({
        status: false,
        message: "Not Enough Money!...",
      });
    }
    await prisma.users.update({
      where: {
        phone: phone,
      },
      data: {
        money: {
          increment: Number(amount),
        },
      },
    });
    const newUser = await prisma.users.update({
      where: {
        phone: ownPhone,
      },
      data: {
        money: {
          decrement: Number(amount),
        },
      },
    });
    return res.status(200).json({
      status: true,
      message: "Money Succesfully Transefered!...",
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};

export const getMinimumWithDrawal = async (req, res) => {
  try {
    const data = await prisma.refer.findFirst({});
    const mwa = data.mwa;
    return res.status(200).json({
      status: true,
      message: "Data Fetched Successfully...",
      data: mwa,
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};

export const getUserBets = async (req, res, next) => {
  try {
    const phone = req.phone;
    if (!phone) {
      return res.status(400).json({
        status: false,
        message: "Details Not Found!...",
        data,
      });
    }
    const data = await prisma.aviator.findMany({
      where: {
        phone: String(phone),
      },
      orderBy: {
        betTime: "desc",
      },
      take: 25,
    });
    return res.status(200).json({
      status: true,
      message: "Data Fetched Successfully...",
      data,
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};
export const getAllBets = async (req, res) => {
  try {
    const data = await prisma.autoaviator.findMany({
      orderBy: {
        betTime: "desc",
      },
    });
    const randomBets = getRandomBets(500);
    const newData = [...data, ...randomBets];
    return res.status(200).json({
      status: true,
      message: "Data Fetched Successfully...",
      data: newData,
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};

export const normalRecharge = async (req, res) => {
  try {
    const { name, email, amount, phone, txn_id, mobile } = req.body;
    const screenshot = "/uploads/" + req.screenshot;
    await prisma.aviatorrechargesecond.create({
      data: {
        mobile: String(mobile),
        screenshot: screenshot,
        email: String(email),
        amount: String(amount),
        phone: String(phone),
        txn_id: String(txn_id),
        name: String(name),
      },
    });
    return res.status(200).json({
      status: true,
      message: "Deposit Request Registered!...",
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};

export const getUserTransaction = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const email = req.email;
    const transactions = await prisma.transaction.findMany({
      where: { email },
      skip: Number(skip),
      take: Number(limit),
      orderBy: {
        id: "desc",
      },
    });

    const totalCount = await prisma.transaction.count({ where: { email } });
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = page;

    return successResponse(res, "All transactions fetched", {
      transactions,
      pagination: {
        totalRecords: totalCount,
        totalPages,
        currentPage,
      },
    });
  } catch (error) {
    console.log(error);
    return failedResponse(res, error.message);
  }
};

// bonus tree (5 level mlm)
const getUsersAtNextLevel = async (users) => {
  let nextLevelUsers = [];
  for (const user of users) {
    const partialData = await prisma.users.findMany({
      where: { invite: user.code },
    });
    const group = partialData.map((childUser) => ({
      user: childUser,
      parent: user,
    }));
    nextLevelUsers = [...nextLevelUsers, ...group];
  }
  return nextLevelUsers;
};

export const userReferralPerLevel = async (req, res) => {
  try {
    const email = req.email;
    const user = await prisma.users.findFirst({ where: { email } });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User Not Found",
      });
    }

    const userCode = user.code;
    let allUsers = {
      level1: [],
      level2: [],
      level3: [],
      level4: [],
      level5: [],
      user: user,
    };

    // Level 1
    allUsers.level1 = await prisma.users.findMany({
      where: { invite: userCode },
    });

    allUsers.level1 = allUsers.level1.map((item) => ({
      user: item,
      parent: user,
    }));

    // Level 2
    allUsers.level2 = await getUsersAtNextLevel(
      allUsers.level1.map((item) => item.user)
    );

    // Level 3
    allUsers.level3 = await getUsersAtNextLevel(
      allUsers.level2.map((item) => item.user)
    );

    // Level 4
    allUsers.level4 = await getUsersAtNextLevel(
      allUsers.level3.map((item) => item.user)
    );

    // Level 5
    allUsers.level5 = await getUsersAtNextLevel(
      allUsers.level4.map((item) => item.user)
    );

    return res.status(200).json({
      status: true,
      message: "All Data Fetched",
      data: allUsers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching user referrals.",
    });
  }
};
