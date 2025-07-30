import prisma from "../prisma/prisma.js";
import NodeCache from "node-cache";
import { failedResponse } from "../utils/response.js";
const memoryCache = new NodeCache({ stdTTL: 5 });
export async function checkRateLimit(phone, betType) {
  try {
    const cacheKey = `${phone}-${betType}`;
    const isRateLimited = memoryCache.get(cacheKey);
    if (isRateLimited !== undefined) {
      return false;
    } else {
      memoryCache.set(cacheKey, true, 5);
      return true;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
}

export const placeBet = async (req, res, next) => {
  try {
    const { betAmount } = req.body;
    const bet = Number(betAmount);
    const phone = req.phone;
    const email = req.email;
    if (!email || !phone) {
      return failedResponse(res, "User Email or Phone Not defined", 404);
    }
    if (bet < 10) {
      return failedResponse(res, "Minimum Bet Amount is 10");
    }
    const user = await prisma.users.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    if (user.status === 2) {
      return res.status(400).json({
        status: false,
        message: "Your account has been blocked. You can't place a bet.",
      });
    }
    let check;
    const deposit = Number(user.deposit);
    const money = Number(user.money);

    if (deposit >= bet) {
      // If deposit is enough to cover the bet
      check = 1;
    } else if (deposit + money >= bet) {
      // If combined deposit and money is enough to cover the bet
      check = 2;
    } else {
      // Insufficient balance
      check = 0;
    }

    if (check === 0) {
      return failedResponse(res, "Insufficient Balance!");
    }
    const canPlaceBet = await checkRateLimit(phone, "betTime1");
    if (!canPlaceBet) {
      return res.status(400).json({
        status: false,
        message: "You can only place a bet once in every round.",
      });
    }
    if (check === 1) {
      await prisma.users.updateMany({
        where: {
          email,
        },
        data: {
          deposit: {
            decrement: bet,
          },
        },
      });
    } else if (check === 2) {
      await prisma.users.updateMany({
        where: {
          email,
        },
        data: {
          money: {
            decrement: bet - deposit,
          },
          deposit: 0,
        },
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Amount Not enough!..",
      });
    }
    await prisma.autoaviator.create({
      data: {
        phone: String(phone),
        betAmount: Number(betAmount),
      },
    });
    const newBet = await prisma.aviator.create({
      data: {
        phone: String(phone),
        betAmount: Number(betAmount),
      },
    });
    const levelBonus = await prisma.bonus.findFirst({});
    if (!levelBonus) {
      return failedResponse(res, "Level Bonus Not defined", 404);
    }
    let level1Bonus = Math.floor((bet * levelBonus.level1) / 100);
    let level2Bonus = Math.floor((bet * levelBonus.level2) / 100);
    let level3Bonus = Math.floor((bet * levelBonus.level3) / 100);
    let level4Bonus = Math.floor((bet * levelBonus.level4) / 100);
    let level5Bonus = Math.floor((bet * levelBonus.level5) / 100);
    let currentInviteCode = user.invite;

    console.log(
      level1Bonus,
      level2Bonus,
      level3Bonus,
      level4Bonus,
      level5Bonus
    );

    const levels = [
      { level: "level1", bonus: level1Bonus },
      { level: "level2", bonus: level2Bonus },
      { level: "level3", bonus: level3Bonus },
      { level: "level4", bonus: level4Bonus },
      { level: "level5", bonus: level5Bonus },
    ];

    for (const { level, bonus } of levels) {
      console.log(bonus, level);
      if (!currentInviteCode) break;
      if (bonus <= 0) continue;
      const currentUser = await prisma.users.findFirst({
        where: { code: currentInviteCode },
      });
      if (!currentUser) break;
      await prisma.users.updateMany({
        where: { code: currentInviteCode },
        data: {
          [level]: { increment: bonus },
          money: { increment: bonus },
        },
      });
      await prisma.transaction.create({
        data: {
          cur: "rev",
          date: new Date(),
          phone: currentUser.phone,
          name_user: currentUser.name_user,
          points: bonus,
          token: bonus,
          type: "d",
          game: "",
          email: currentUser.email,
          receiver: currentUser.code,
          sender: currentInviteCode,
        },
      });
      currentInviteCode = currentUser.invite; // Move to the next level up
    }
    return res.status(200).json({
      status: true,
      message: "Bet successfully placed!",
      betId: newBet.id,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: false,
      message: "An error occurred: " + err.message,
    });
  }
};

export const placeBet2 = async (req, res, next) => {
  try {
    const { betAmount } = req.body;
    const bet = Number(betAmount);
    const phone = req.phone;
    const email = req.email;
    if (!email || !phone) {
      return failedResponse(res, "User Email or Phone Not defined", 404);
    }
    if (bet < 10) {
      return failedResponse(res, "Minimum Bet Amount is 10");
    }
    const user = await prisma.users.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    if (user.status === 2) {
      return res.status(400).json({
        status: false,
        message: "Your account has been blocked. You can't place a bet.",
      });
    }
    let check;
    const deposit = Number(user.deposit);
    const money = Number(user.money);

    if (deposit >= bet) {
      // If deposit is enough to cover the bet
      check = 1;
    } else if (deposit + money >= bet) {
      // If combined deposit and money is enough to cover the bet
      check = 2;
    } else {
      // Insufficient balance
      check = 0;
    }

    if (check === 0) {
      return failedResponse(res, "Insufficient Balance!");
    }
    const canPlaceBet = await checkRateLimit(phone, "betTime2");
    if (!canPlaceBet) {
      return res.status(400).json({
        status: false,
        message: "You can only place a bet once in every round.",
      });
    }
    if (check === 1) {
      await prisma.users.updateMany({
        where: {
          email,
        },
        data: {
          deposit: {
            decrement: bet,
          },
        },
      });
    } else if (check === 2) {
      await prisma.users.updateMany({
        where: {
          email,
        },
        data: {
          money: {
            decrement: bet - deposit,
          },
          deposit: 0,
        },
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Amount Not enough!..",
      });
    }
    await prisma.autoaviator.create({
      data: {
        phone: String(phone),
        betAmount: Number(betAmount),
      },
    });
    const newBet = await prisma.aviator.create({
      data: {
        phone: String(phone),
        betAmount: Number(betAmount),
      },
    });
    const levelBonus = await prisma.bonus.findFirst({});
    if (!levelBonus) {
      return failedResponse(res, "Level Bonus Not defined", 404);
    }
    let level1Bonus = Math.floor((bet * levelBonus.level1) / 100);
    let level2Bonus = Math.floor((bet * levelBonus.level2) / 100);
    let level3Bonus = Math.floor((bet * levelBonus.level3) / 100);
    let level4Bonus = Math.floor((bet * levelBonus.level4) / 100);
    let level5Bonus = Math.floor((bet * levelBonus.level5) / 100);
    let currentInviteCode = user.invite;
    const levels = [
      { level: "level1", bonus: level1Bonus },
      { level: "level2", bonus: level2Bonus },
      { level: "level3", bonus: level3Bonus },
      { level: "level4", bonus: level4Bonus },
      { level: "level5", bonus: level5Bonus },
    ];

    for (const { level, bonus } of levels) {
      if (!currentInviteCode) break;
      if (bonus <= 0) continue;
      const currentUser = await prisma.users.findFirst({
        where: { code: currentInviteCode },
      });
      if (!currentUser) break;
      await prisma.users.updateMany({
        where: { code: currentInviteCode },
        data: {
          [level]: { increment: bonus },
          money: { increment: bonus },
        },
      });
      await prisma.transaction.create({
        data: {
          cur: "rev",
          date: new Date(),
          phone: currentUser.phone,
          name_user: currentUser.name_user,
          points: bonus,
          token: bonus,
          type: "d",
          game: "",
          email: currentUser.email,
          receiver: currentUser.code,
          sender: currentInviteCode,
        },
      });
      currentInviteCode = currentUser.invite; // Move to the next level up
    }
    return res.status(200).json({
      status: true,
      message: "Bet successfully placed!",
      betId: newBet.id,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: false,
      message: "An error occurred: " + err.message,
    });
  }
};
export const withdrawBet = async (req, res) => {
  try {
    const phone = req.phone;
    const email = req.email;
    if (!req.body) {
      return res.status(400).json({
        status: false,
        message: "Request body not defined",
      });
    }
    const { multiplier, betId, id } = req.body;
    const user = await prisma.users.findFirst({
      where: { phone: String(phone) },
    });
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }
    let canWithDraw =
      id === 1
        ? await checkRateLimit(phone, "withdraw1")
        : await checkRateLimit(phone, "withdraw2");
    if (!canWithDraw) {
      return;
    }
    const aviator = await prisma.aviator.findFirst({
      where: { id: Number(betId) },
    });

    if (!aviator) {
      return res.status(404).json({
        status: false,
        message: "Bet not found",
      });
    }

    const withdrawAmount = Math.floor(Number(multiplier) * aviator.betAmount);
    await prisma.aviator.updateMany({
      where: { id: betId },
      data: {
        withdrawAmount,
        multiplier: Number(multiplier),
        withdrawTime: new Date().toISOString(),
      },
    });

    await prisma.autoaviator.updateMany({
      where: { id: betId },
      data: {
        withdrawAmount,
        multiplier: Number(multiplier),
        withdrawTime: new Date().toISOString(),
      },
    });
    await prisma.users.updateMany({
      where: { phone: String(phone) },
      data: { money: { increment: withdrawAmount } },
    });
    return res.status(200).json({
      status: true,
      message: `${withdrawAmount} successfully added to your account`,
      amount: withdrawAmount,
      multiplier: Number(multiplier),
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: false,
      message: `Internal server error: ${err.message}`,
    });
  }
};
export const crashedPlaneSettings = async (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        status: false,
        message: "Request body not defined",
      });
    }
    const existingCrashedPlane = await prisma.crashedplane.findUnique({
      where: {
        id: 1,
      },
    });
    if (!existingCrashedPlane) {
      await prisma.crashedplane.create();
    }
    const { nl, nh, sl, sh, sp, sm, ml, mh, mr, da } = req.body;
    if (nl && nh) {
      await prisma.crashedplane.update({
        where: {
          id: 1,
        },
        data: {
          nl: String(nl),
          nh: String(nh),
        },
      });

      return res.status(200).json({
        status: true,
        message: "Settings Updated",
      });
    }
    if (sl && sh && sp && sm) {
      await prisma.crashedplane.update({
        where: {
          id: 1,
        },
        data: {
          sl: String(sl),
          sh: String(sh),
          sm: String(sm),
          sp: String(sp),
        },
      });
      return res.status(200).json({
        status: true,
        message: "Settings Updated",
      });
    }
    if (ml && mh && da) {
      const updateData = {
        ml: String(ml),
        mh: String(mh),
        da: String(da),
      };

      if (mr) {
        updateData.mr = String(mr);
      }

      await prisma.crashedplane.update({
        where: {
          id: 1,
        },
        data: updateData,
      });
      return res.status(200).json({
        status: true,
        message: "Settings Updated",
      });
    }

    return res.status(200).json({
      status: false,
      message: "Please fill Require Fields",
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};

export const getCrashedPlaneSettings = async (req, res, next) => {
  try {
    const settings = await prisma.crashedplane.findFirst({});
    return res.status(200).json({
      status: true,
      message: "data Found!....",
      data: settings,
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};

export const totalSumAmount = async (req, res, next) => {
  try {
    const settings = await prisma.bettime.findFirst({
      where: {
        id: 1,
      },
    });
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
    const betData = await prisma.aviator.findMany({
      where: {
        betTime: {
          gte: oneMinuteAgo.toISOString(), // Greater than or equal to one minute ago
        },
      },
    });
    const betTimesInMilliseconds = betData.map((item) => ({
      ...item,
      betTime: Number(new Date(item.betTime).getTime()), // Convert betTime to milliseconds
    }));
    const lowertime = Number(settings.time);
    const uppertime = lowertime + 15000;
    const filteredBetData = betTimesInMilliseconds.filter((item) => {
      const betTimeInMilliseconds = item.betTime;
      return (
        betTimeInMilliseconds > lowertime && betTimeInMilliseconds < uppertime
      );
    });
    const sumOfAmount = filteredBetData.reduce(
      (sum, item) => sum + item.betAmount,
      0
    );
    return res.status(200).json({
      status: true,
      message: "data Found!....",
      data: betTimesInMilliseconds,
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};

export const deleteAllBets = async (req, res, next) => {
  try {
    await prisma.autoaviator.deleteMany();
    return res.status(200).json({
      status: true,
      message: "all bets deleted Successfully",
    });
  } catch (err) {
    console.log(err);
    //console.log(err.message);
  }
};
