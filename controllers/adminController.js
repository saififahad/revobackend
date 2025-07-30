import prisma from "../prisma/prisma.js";
import { failedResponse, successResponse } from "../utils/response.js";
export const setReferDetatails = async (req, res) => {
  try {
    const {
      parentCommission,
      childrenCommission,
      notReferCommission,
      mwa,
      usdt,
      rev,
      privatekey,
      address,
      mda,
      level1,
      level2,
      level3,
      level4,
      level5,
    } = req.body;

    console.log(req.body);

    if (
      !parentCommission ||
      !childrenCommission ||
      // !notReferCommission ||
      !mwa ||
      !usdt ||
      !rev ||
      !privatekey ||
      !address ||
      !mda ||
      !level1 ||
      !level2 ||
      !level3 ||
      !level4 ||
      !level5
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Insufficient data provided. Please ensure all fields are filled.",
      });
    }
    // Using Prisma's upsert method to either update or create a new record
    const result = await prisma.refer.upsert({
      where: { id: 1 }, // assuming 'id' is the unique identifier for the 'refer' record
      update: {
        parentCommission: Number(parentCommission),
        childrenCommission: Number(childrenCommission),
        notReferCommission: Number(notReferCommission),
        mwa: Number(mwa),
        mda: Number(mda),
        usdt: Number(usdt),
        rev: parseFloat(rev),
        privatekey: privatekey ? String(privatekey) : undefined,
        address: address ? String(address) : undefined,
      },
      create: {
        parentCommission: Number(parentCommission),
        childrenCommission: Number(childrenCommission),
        notReferCommission: Number(notReferCommission),
        mwa: Number(mwa),
        mda: Number(mda),
        usdt: Number(usdt),
        rev: Number(rev),
        privatekey: String(privatekey),
        address: String(address),
      },
    });
    await prisma.bonus.updateMany({
      data: {
        level1: parseFloat(level1),
        level2: parseFloat(level2),
        level3: parseFloat(level3),
        level4: parseFloat(level4),
        level5: parseFloat(level5),
      },
    });
    return res.status(200).json({
      status: true,
      message: "Refer details successfully updated!",
      data: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: false,
      message: `Error updating refer details: ${err.message}`,
    });
  }
};

export const getReferDetails = async (req, res) => {
  try {
    const refer = await prisma.refer.findFirst({});
    const bonus = await prisma.bonus.findFirst({});
    return res.status(200).json({
      status: true,
      data: { ...refer, ...bonus },
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      message: err.message,
      status: false,
    });
  }
};
export const getAllBetData = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;
    const email = req.query.email;
    const user = await prisma.users.findFirst({ where: { email: email } });
    const phone = user.phone;
    if (!phone) {
      const alldata = await prisma.aviator.findMany();
      const data = await prisma.aviator.findMany({
        skip: Number(skip),
        take: Number(limit),
        orderBy: {
          id: "desc",
        },
      });

      return res.status(200).json({
        status: true,
        message: "BetData Successfully fetched!...",
        data,
        length: alldata.length,
      });
    } else {
      const alldata = await prisma.aviator.findMany({
        where: { phone: phone },
      });
      const data = await prisma.aviator.findMany({
        where: { phone: phone },
        skip: Number(skip),
        take: Number(limit),
        orderBy: {
          id: "desc",
        },
      });

      return res.status(200).json({
        status: true,
        message: "BetData Successfully fetched!...",
        data: { data, length: alldata.length },
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};

export const allUserBetData = async (req, res) => {
  const { page, limit } = req.query;
  const skip = (page - 1) * limit;

  const alldata = (await prisma.aviator.findMany()) || {};
  const data =
    (await prisma.aviator.findMany({
      skip: Number(skip),
      take: Number(limit),
      orderBy: {
        id: "desc",
      },
    })) || {};

  return res.status(200).json({
    status: true,
    message: "allBetData Successfully fetched!...",
    data,
    length: alldata.length,
  });
};

export const acceptWithdraw = async (req, res) => {
  try {
    const { id, status, money, phone } = req.body;
    if (!id || !status || !phone || !money) {
      return res.status(400).json({
        status: false,
        message: "Client Side error",
      });
    }
    //console.log("hi");

    await prisma.withdraw.updateMany({
      where: {
        id: Number(id),
      },
      data: {
        status: Number(status),
      },
    });
    if (status === "2") {
      await prisma.users.updateMany({
        where: {
          phone,
        },
        data: {
          money: {
            increment: Number(money),
          },
        },
      });
    }

    return res.status(200).json({
      status: true,
      message: "Successfully updated!...",
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};
export const acceptRecharge = async (req, res) => {
  try {
    const { id, status, phone, amount } = req.body;
    if (!id || !status || !phone || !amount) {
      return res.status(400).json({
        status: false,
        message: "Client Side error",
      });
    }

    if (Number(status) === 2) {
      await prisma.aviatorrechargesecond.updateMany({
        where: {
          id: Number(id),
        },
        data: {
          status: String(status),
        },
      });
    } else {
      await prisma.users.updateMany({
        where: {
          phone: String(phone),
        },
        data: {
          money: {
            increment: Number(amount),
          },
        },
      });
      await prisma.aviatorrechargesecond.updateMany({
        where: {
          id: Number(id),
        },
        data: {
          status: String(status),
        },
      });
    }
    return res.status(200).json({
      status: true,
      message: "Successfully updated!...",
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};
export const getAllWithdrawalRequest = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;
    const alldata = await prisma.transaction.findMany();
    const data = await prisma.transaction.findMany({
      where: { type: "w" },
      skip: Number(skip),
      take: Number(limit),
      orderBy: {
        id: "desc",
      },
    });
    return res.status(200).json({
      status: true,
      message: "RechargeData Successfully fetched!...",
      data,
      length: alldata.length,
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};
export const getAllUserData = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;
    const alldata = await prisma.users.findMany();
    const data = await prisma.users.findMany({
      skip: Number(skip),
      take: Number(limit),
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json({
      status: true,
      message: "userData Successfully fetched!...",
      data,
      allData: alldata,
      length: alldata.length,
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};
export const userSettings = async (req, res) => {
  try {
    const { id, status, money, phone, deposit } = req.body;
    if (!id || !phone) {
      return res.status(400).json({
        status: false,
        message: "Client Side error",
      });
    }
    if (money) {
      await prisma.users.updateMany({
        where: {
          phone,
        },
        data: {
          money: Number(money),
        },
      });
    }
    if (deposit) {
      await prisma.users.updateMany({
        where: {
          phone,
        },
        data: {
          deposit: Number(deposit),
        },
      });
    }
    if (status) {
      await prisma.users.updateMany({
        where: {
          phone,
        },
        data: {
          status: Number(status),
        },
      });
    }
    return res.status(200).json({
      status: true,
      message: "Successfully updated!...",
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};

export const getAllRechargeDetails = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;
    const alldata = await prisma.transaction.findMany({});
    const data = await prisma.transaction.findMany({
      where: { type: "d" },
      skip: Number(skip),
      take: Number(limit),
      orderBy: {
        id: "desc",
      },
    });
    return res.status(200).json({
      status: true,
      message: "RechargeData Successfully fetched!...",
      data,
      length: alldata.length,
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};

export const getDashBoardDetails = async (req, res) => {
  try {
    const totalRechargeAmount = await prisma.transaction.findMany({
      where: {
        type: "d",
      },
      select: {
        points: true,
      },
    });
    const today = new Date().toISOString().split("T")[0];

    const totalRechargeSum = totalRechargeAmount.reduce(
      (sum, entry) => sum + entry.points,
      0
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayRechargeAmount = await prisma.transaction.findMany({
      where: {
        date: {
          gte: todayStart,
          lt: todayEnd,
        },
        type: "d",
      },
      select: {
        points: true,
      },
    });

    const todayRechargeSum = todayRechargeAmount.reduce(
      (sum, entry) => sum + entry.points,
      0
    );

    const totalUsers = await prisma.users.findMany({
      orderBy: {
        time: "desc",
      },
    });
    const totalBetData = await prisma.aviator.findMany();
    const activeUsers = totalUsers.filter((item) => item.status === 1);
    const rejectedUsers = totalUsers.filter((item) => item.status === 2);
    const currentDate = new Date().toISOString();
    const currentDateMilliseconds = new Date().getTime();
    var MoreTodayUsers = totalUsers.filter(
      (item) => item.time && item.time === currentDateMilliseconds
    );
    var todayUsers = totalUsers.filter(
      (item) => item.time && item.time.startsWith(currentDate)
    );
    todayUsers = todayUsers.length + MoreTodayUsers.length;
    const withdrawData = await prisma.transaction.findMany({
      where: {
        type: "w",
      },
      select: {
        points: true,
      },
    });
    const totalWithdrawAmount = withdrawData.reduce(
      (total, withdraw) => total + withdraw.points,
      0
    );
    const totalBetAmount = totalBetData.reduce(
      (total, bet) => total + bet.betAmount,
      0
    );
    const totalWinning = totalBetData.reduce(
      (total, bet) => total + bet.withdrawAmount,
      0
    );
    const totalProfit = totalBetAmount - totalWinning;

    const todayWithdrawData = await prisma.transaction.findMany({
      where: {
        date: {
          gte: todayStart, // Greater than or equal to the start of today
          lt: todayEnd, // Less than the end of today (not inclusive)
        },
        type: "w",
      },
      select: {
        points: true,
      },
    });

    const todayWithdrawAmount = todayWithdrawData.reduce(
      (total, withdraw) => total + withdraw.points,
      0
    );

    //console.log("Today's Withdraw Amount:", todayWithdrawAmount);
    const todayBetData = await prisma.aviator.findMany({
      where: {
        betTime: {
          gte: today + "T00:00:00.000Z",
          lte: today + "T23:59:59.999Z",
        },
      },
    });
    const totalWingoBet = await prisma.betwingo.count({});
    const todayWingoBet = await prisma.betwingo.count({
      where: {
        time: {
          gte: today + "T00:00:00.000Z",
          lte: today + "T23:59:59.999Z",
        },
      },
    });
    const totalWingoProfitLoss = await prisma.betwingo.findMany({});
    const totalWingoBetAmount = totalWingoProfitLoss.reduce(
      (sum, entry) => Number(sum) + Number(entry.betAmount),
      0
    );
    const totalWingoGetAmount = totalWingoProfitLoss.reduce(
      (sum, entry) => Number(sum) + Number(entry.get),
      0
    );
    const twpl = totalWingoBetAmount - totalWingoGetAmount;
    const data = {
      totalRechargeAmount: totalRechargeSum,
      todayRechargeAmount: todayRechargeSum,
      totalWithdrawAmount: totalWithdrawAmount,
      totalBetAmount: totalBetAmount,
      totalProfit: totalProfit,
      todayWithdrawAmount,
      totalUsers: totalUsers.length,
      totalBets: totalBetData.length,
      activeUsers: activeUsers.length,
      rejectedUsers: rejectedUsers.length,
      todayUsers,
      todayBets: todayBetData.length,
      twpl: twpl,
      totalWingoBet: totalWingoBet,
      todayWingoBet: todayWingoBet,
      totalWingoBetAmount: totalWingoBetAmount,
      totalWingoGetAmount: totalWingoGetAmount,
    };
    return res.status(200).json({
      status: true,
      message: "RechargeData Successfully fetched!...",
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
export const getCurrentRoundBets = async (req, res) => {
  try {
    const autoaviatorData = await prisma.autoaviator.findMany({
      orderBy: {
        betTime: "desc",
      },
    });
    const totalBetAmount = autoaviatorData.reduce(
      (total, item) => total + item.betAmount,
      0
    );

    //console.log("Total Bet Amount:", totalBetAmount);
    const totalWithdrawAmount = autoaviatorData.reduce(
      (total, item) => total + (item.withdrawAmount || 0),
      0
    );

    //console.log("Total Withdraw Amount:", totalWithdrawAmount);
    // Create a set to store unique phone numbers
    const uniquePhones = new Set();

    // Iterate over the array and add unique phones to the set
    autoaviatorData.forEach((item) => {
      uniquePhones.add(item.phone);
    });

    // Get the total number of unique users
    const totalUniqueUsers = uniquePhones.size;

    //console.log("Total Unique Users:", totalUniqueUsers);
    const uniquePhonesWithWithdraw = new Set();

    // Iterate over the array and add unique phones with non-zero withdrawAmount to the set
    autoaviatorData.forEach((item) => {
      if (item.withdrawAmount !== 0) {
        uniquePhonesWithWithdraw.add(item.phone);
      }
    });
    const uniqueWithdraw = uniquePhonesWithWithdraw.size;
    // const totalWithDraw=data.
    return res.status(200).json({
      status: true,
      message: "Data Fetched Successfully...",
      data: {
        totalmoney: totalBetAmount,
        totalwithdraw: totalWithdrawAmount,
        totalUsers: totalUniqueUsers,
        totalWithdrawUsers: uniqueWithdraw,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};
export const getAllNormalRechargeDetails = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const skip = (page - 1) * limit;
    const alldata = await prisma.aviatorrechargesecond.findMany();
    const data = await prisma.aviatorrechargesecond.findMany({
      skip: Number(skip),
      take: Number(limit),
      orderBy: {
        id: "desc",
      },
    });
    return res.status(200).json({
      status: true,
      message: "RechargeData Successfully fetched!...",
      data,
      length: alldata.length,
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};

// create bonus
export const createBonusValue = async (req, res) => {
  try {
    const { bonus, money } = req.body;
    await prisma.bonus.create({
      data: {
        money,
        bonus,
      },
    });
    return res.status(200).json({
      status: true,
      message: "Bonus Value Set Successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};
// getbonus
export const getAllBonus = async (req, res) => {
  try {
    const data = await prisma.bonus.findMany({});
    return res.status(200).json({
      status: true,
      message: "Bonus Value Fetched Successfully",
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
//
export const deleteBonus = async (req, res) => {
  try {
    const id = req.body.id;
    await prisma.bonus.deleteMany({ where: { id } });
    return res.status(200).json({
      status: true,
      message: "Bonus Value Deleted Successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};

export const allTransaction = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const email = req.query.email;
    if (!email) {
      return failedResponse(res, "Email Not Found", 404);
    }
    const length = await prisma.transaction.count({
      where: {
        email: email,
      },
    });
    const allTransaction = await prisma.transaction.findMany({
      where: { email: email },
      skip: Number(skip),
      take: Number(limit),
      orderBy: {
        id: "desc",
      },
    });
    return successResponse(res, "data fetched", {
      data: allTransaction,
      length,
    });
  } catch (error) {
    console.log(error);
    return failedResponse(res, error.message);
  }
};

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

export const adminReferralPerLevel = async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return;
    }
    const user = await prisma.users.findFirst({ where: { email } });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User Not Found",
      });
    }
    const userCode = user.code;
    const inviteCode = user?.invite || "";
    let parentUser;
    if (inviteCode) {
      parentUser = await prisma.users.findFirst({
        where: {
          code: inviteCode,
        },
      });
    } else {
      parentUser = [];
    }
    let allUsers = {
      level1: [],
      level2: [],
      level3: [],
      level4: [],
      level5: [],
      user: user,
      parentUser: parentUser,
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
