import { successResponse, failedResponse } from "./../utils/response.js";
import Decimal from "decimal.js";
import prisma from "../prisma/prisma.js";
const isNumber = (params) => {
  let pattern = /^[0-9]*\d$/;
  return pattern.test(params);
};

function formateT(params) {
  let result = params < 10 ? "0" + params : params;
  return result;
}

export const betWinGo = async (req, res) => {
  try {
    const email = req.email;
    if (!email) {
      return failedResponse(res, "User Unauthorized, Please login again");
    }
    let { typeid, join, x, money, stage } = req.body;
    // x is quantity
    if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10) {
      return res.status(200).json({
        message: "Error!",
        status: false,
      });
    }

    let gameJoin = "";
    if (typeid == 1) gameJoin = "wingo1";
    if (typeid == 3) gameJoin = "wingo3";
    if (typeid == 5) gameJoin = "wingo5";
    if (typeid == 10) gameJoin = "wingo10";

    const user = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });

    if (!user || !isNumber(x) || !isNumber(money) || !isNumber(stage)) {
      return res.status(200).json({
        message: "Error!",
        status: false,
      });
    }

    // let feeperbet = money * x * 0.02;
    let feeperbet = money * x * 0;
    const betAmount = money * x - x * feeperbet;
    let check;
    const bet = Number(x * money);
    const deposit = Number(user.deposit);
    const balance = Number(user.money);

    if (deposit >= bet) {
      // If deposit is enough to cover the bet
      check = 1;
    } else if (deposit + balance >= bet) {
      // If combined deposit and money is enough to cover the bet
      check = 2;
    } else {
      // Insufficient balance
      check = 0;
    }

    // let check = user.money - x * money;
    if (check == 0) {
      return failedResponse(res, "Insufficient Balance");
    }
    let date = new Date();
    let years = formateT(date.getFullYear());
    let months = formateT(date.getMonth() + 1);
    let days = formateT(date.getDate());
    let id_product =
      years + months + days + Math.floor(Math.random() * 1000000000000000);

    await prisma.betwingo.create({
      data: {
        id_product: String(id_product),
        fee: feeperbet,
        bet: join,
        status: 0,
        betAmount: betAmount.toFixed(2),
        name: user.name_user,
        email,
        phone: user.phone,
        stage: String(stage),
        get: 0,
        game: gameJoin,
        result: 0,
      },
    });

    if (check === 1) {
      await prisma.users.updateMany({
        where: { email: email },
        data: {
          deposit: {
            decrement: bet,
          },
        },
      });
    } else if (check === 2) {
      await prisma.users.updateMany({
        where: { email: email },
        data: {
          money: {
            decrement: bet - deposit,
          },
          deposit: 0,
        },
      });
    }
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
    return successResponse(res, "Bet Placed Successfully");
  } catch (error) {
    console.log(error);
    console.error(error);
    return failedResponse(res, error.message);
  }
};

export const getCurrentGame = async (req, res) => {
  const game = req.query.game;
  if (!game) {
    return failedResponse(res, "Game not persent in id");
  }
  let join;
  if (game == 1) join = "wingo1";
  if (game == 3) join = "wingo3";
  if (game == 5) join = "wingo5";
  if (game == 10) join = "wingo10";
  const findGame = await prisma.wingo.findFirst({
    where: { game: join, status: 0 },
  });
  return successResponse(res, "Game Period Fetched", {
    period: findGame?.period,
  });
};

export const getSingleUserBetsHistory = async (req, res) => {
  const game = req.query.game;
  const email = req.email;
  const { page, limit } = req.query;
  let join;
  if (game == 1) join = "wingo1";
  if (game == 3) join = "wingo3";
  if (game == 5) join = "wingo5";
  if (game == 10) join = "wingo10";
  const allbets = await prisma.betwingo.findMany({
    where: { email: email, game: join },
    skip: Number((page - 1) * limit),
    take: Number(limit),
    orderBy: {
      stage: "desc",
    },
  });
  const length = await prisma.betwingo.count({
    where: { email: email, game: join },
  });
  return successResponse(res, "All Bets Fetched", {
    bets: allbets,
    length: length || 1,
  });
};
//===== get All Bets =======
export const getAllBets = async (req, res) => {
  const { page, limit } = req.query;
  const email = req.query.email;
  console.log(page, limit);

  if (!email) {
    const allBets = await prisma.betwingo.findMany({
      skip: Number((page - 1) * limit),
      take: Number(limit),
      orderBy: {
        stage: "desc",
      },
    });
    const length = await prisma.betwingo.count({});
    successResponse(res, "All Bet Fetched", {
      curBets: allBets,
      length: length || 1,
    });
  } else {
    const allBets = await prisma.betwingo.findMany({
      where: { email: email },
      skip: Number((page - 1) * limit),
      take: Number(limit),
      orderBy: {
        stage: "desc",
      },
    });
    const length = await prisma.betwingo.count({
      where: { email: email },
    });
    successResponse(res, "All Bet Fetched", {
      curBets: allBets,
      length: length || 1,
    });
  }
};

export const allGamesHistory = async (req, res) => {
  const game = req.query.game;
  const { page, limit } = req.query;
  let join;
  if (game == 1) join = "wingo1";
  if (game == 3) join = "wingo3";
  if (game == 5) join = "wingo5";
  if (game == 10) join = "wingo10";
  const allGames = await prisma.wingo.findMany({
    where: { game: join, status: 2 },
    skip: Number((page - 1) * limit),
    take: Number(limit),
    orderBy: {
      period: "desc", // Sorting by 'createdAt' in descending order
    },
  });
  const length = await prisma.wingo.count({
    where: { game: join, status: 2 },
  });

  return successResponse(res, "All Bets Fetched", {
    games: allGames,
    length: length || 1,
  });
};

export const currentGameLiveStats = async (req, res) => {
  const period = req.query.period;
  const game = req.query.game;
  let join = "";
  if (game == 1) join = "wingo1";
  if (game == 3) join = "wingo3";
  if (game == 5) join = "wingo5";
  if (game == 10) join = "wingo10";
  if (!period) {
    return;
  }
  const allBets = await prisma.betwingo.findMany({
    where: { status: 0, stage: period, game: join },
  });

  let zero = new Decimal(0);
  let one = new Decimal(0);
  let two = new Decimal(0);
  let three = new Decimal(0);
  let four = new Decimal(0);
  let five = new Decimal(0);
  let six = new Decimal(0);
  let seven = new Decimal(0);
  let eight = new Decimal(0);
  let nine = new Decimal(0);
  let small = new Decimal(0);
  let big = new Decimal(0);
  let red = new Decimal(0);
  let green = new Decimal(0);
  let violet = new Decimal(0);

  allBets.forEach((item) => {
    let betAmount = new Decimal(item.betAmount); // Ensure betAmount is a Decimal
    switch (item.bet) {
      case "0":
        zero = zero.plus(betAmount);
        break;
      case "1":
        one = one.plus(betAmount);
        break;
      case "2":
        two = two.plus(betAmount);
        break;
      case "3":
        three = three.plus(betAmount);
        break;
      case "4":
        four = four.plus(betAmount);
        break;
      case "5":
        five = five.plus(betAmount);
        break;
      case "6":
        six = six.plus(betAmount);
        break;
      case "7":
        seven = seven.plus(betAmount);
        break;
      case "8":
        eight = eight.plus(betAmount);
        break;
      case "9":
        nine = nine.plus(betAmount);
        break;
      case "n":
        small = small.plus(betAmount);
        break;
      case "l":
        big = big.plus(betAmount);
        break;
      case "d":
        red = red.plus(betAmount);
        break;
      case "x":
        green = green.plus(betAmount);
        break;
      case "t":
        violet = violet.plus(betAmount);
        break;
      default:
        break;
    }
  });
  let total = zero
    .plus(one)
    .plus(two)
    .plus(three)
    .plus(four)
    .plus(five)
    .plus(six)
    .plus(seven)
    .plus(eight)
    .plus(nine)
    .plus(small)
    .plus(big)
    .plus(red)
    .plus(green)
    .plus(violet);
  let counts = {
    zero,
    one,
    two,
    three,
    four,
    five,
    six,
    seven,
    eight,
    nine,
    small,
    big,
    red,
    violet,
    green,
    total,
  };
  successResponse(res, "Live Stats", { counts });
};

export const currentRoundBets = async (req, res) => {
  const { page, limit, period, game } = req.query;
  let join = "";
  if (game == 1) join = "wingo1";
  if (game == 3) join = "wingo3";
  if (game == 5) join = "wingo5";
  if (game == 10) join = "wingo10";
  if (!period || !game) {
    return;
  }
  const allBets = await prisma.betwingo.findMany({
    where: { status: 0, stage: period, game: join },
    skip: Number((page - 1) * limit),
    take: Number(limit),
    orderBy: {
      stage: "desc",
    },
  });
  const length = await prisma.betwingo.count({
    where: { status: 0, stage: period, game: join },
  });
  successResponse(res, "All Bet Fetched", {
    curBets: allBets,
    length: length || 1,
  });
};
export const setGameResult = async (req, res) => {
  const { period, game, result } = req.body;
  if (!period || !game || !result) {
    return failedResponse(res, "Invalid Input");
  }
  let join, stage;
  if (game == 1) {
    join = "wingo1";
    stage = "period1";
  }
  if (game == 3) {
    join = "wingo3";
    stage = "period3";
  }
  if (game == 5) {
    join = "wingo5";
    stage = "period5";
  }
  if (game == 10) {
    join = "wingo10";
    stage = "period10";
  }
  await prisma.admin.updateMany({
    data: {
      [stage]: period,
      [join]: result,
    },
  });
  successResponse(res, "Result Declared Successfully");
};

// calculation work
export const addWinGo = async (game) => {
  try {
    let join = "";
    if (game == 1) join = "wingo1";
    if (game == 3) join = "wingo3";
    if (game == 5) join = "wingo5";
    if (game == 10) join = "wingo10";
    const findGame = await prisma.wingo.findFirst({
      where: { game: join, status: 0 },
    });

    let period = findGame?.period;
    if (!period) {
      return;
    }

    if (!findGame || !findGame.period) {
      return;
    }
    const allBets = await prisma.betwingo.findMany({
      where: { status: 0, stage: period, game: join },
    });
    const admin = await prisma.admin.findFirst({ where: { id: 1 } });

    let result;
    if (allBets.length > 0) {
      result = calculatePayoutsWithColors(allBets);
    } else {
      result = Math.floor(Math.random() * 10);
    }
    // admin result declaration
    if (game == 1 && admin?.period1 == period) {
      result = Number(admin?.wingo1);
    } else if (game == 3 && admin?.period3 == period) {
      result = Number(admin?.wingo3);
    } else if (game == 5 && admin?.period5 == period) {
      result = Number(admin?.wingo5);
    } else if (game == 10 && admin?.period10 == period) {
      result = Number(admin?.wingo10);
    }

    await prisma.wingo.updateMany({
      where: {
        period: period,
        status: 0,
        game: join,
      },
      data: {
        result: Number(result), // Ensure 'result' is converted to a number
        status: 2,
      },
    });

    const smallNumbers = ["0", "1", "2", "3", "4"];
    const bigNumbers = ["5", "6", "7", "8", "9"];
    const greenNumbers = ["1", "3", "7", "9", "5"];
    const redNumbers = ["0", "2", "4", "6", "8"];
    const violetNumbers = ["0", "5"];
    for (const singleBet of allBets) {
      const email = singleBet.email;
      const bet = singleBet.bet;
      const total = parseFloat(singleBet.betAmount.toFixed(2));
      let totalGet = 0;
      let status = 1;

      if (["l", "n"].includes(bet)) {
        if (bet === "l" && bigNumbers.includes(result)) {
          totalGet = total * 2;
        } else if (bet === "n" && smallNumbers.includes(result)) {
          totalGet = total * 2;
        }
      } else if ([0, 5].includes(result)) {
        if (bet === "d" && redNumbers.includes(result)) {
          totalGet = total * 2;
        } else if (bet === "x" && greenNumbers.includes(result)) {
          totalGet = total * 2;
        } else if (bet === "t" && violetNumbers.includes(result)) {
          totalGet = total * 2;
        }
      } else if (String(result) === bet) {
        totalGet = total * 9;
      }

      if (totalGet === 0) {
        status = 2;
      }

      await prisma.betwingo.updateMany({
        where: { id: singleBet.id },
        data: { status, get: totalGet, result: Number(result) },
      });

      await prisma.users.updateMany({
        where: { email: email },
        data: {
          money: {
            increment: totalGet,
          },
        },
      });
    }

    // console.log(period, game);

    await prisma.wingo.create({
      data: {
        period: `${Number(period) + 1}`,
        game: join,
        result: Number(result),
        status: 0,
      },
    });
    return result;
  } catch (error) {
    console.log(error);
    console.error(error);
  }
};
// calculate money on every number
export const calculatePayoutsWithColors = (bets) => {
  const betMultipliers = {
    0: 9,
    1: 9,
    2: 9,
    3: 9,
    4: 9,
    5: 9,
    6: 9,
    7: 9,
    8: 9,
    9: 9,
    l: 2,
    n: 2,
    d: 2,
    x: 2,
    t: 2,
  };

  const smallNumbers = ["0", "1", "2", "3", "4"];
  const bigNumbers = ["5", "6", "7", "8", "9"];
  const greenNumbers = ["1", "3", "7", "9", "5"];
  const redNumbers = ["0", "2", "4", "6", "8"];
  const violetNumbers = ["0", "5"];

  let zero = new Decimal(0);
  let one = new Decimal(0);
  let two = new Decimal(0);
  let three = new Decimal(0);
  let four = new Decimal(0);
  let five = new Decimal(0);
  let six = new Decimal(0);
  let seven = new Decimal(0);
  let eight = new Decimal(0);
  let nine = new Decimal(0);
  let small = new Decimal(0);
  let big = new Decimal(0);
  let red = new Decimal(0);
  let violet = new Decimal(0);
  let green = new Decimal(0);

  bets.forEach((item) => {
    let betAmount = new Decimal(item.betAmount);
    switch (item.bet) {
      case "0":
        zero = zero.plus(betAmount.times(betMultipliers["0"]));
        break;
      case "1":
        one = one.plus(betAmount.times(betMultipliers["1"]));
        break;
      case "2":
        two = two.plus(betAmount.times(betMultipliers["2"]));
        break;
      case "3":
        three = three.plus(betAmount.times(betMultipliers["3"]));
        break;
      case "4":
        four = four.plus(betAmount.times(betMultipliers["4"]));
        break;
      case "5":
        five = five.plus(betAmount.times(betMultipliers["5"]));
        break;
      case "6":
        six = six.plus(betAmount.times(betMultipliers["6"]));
        break;
      case "7":
        seven = seven.plus(betAmount.times(betMultipliers["7"]));
        break;
      case "8":
        eight = eight.plus(betAmount.times(betMultipliers["8"]));
        break;
      case "9":
        nine = nine.plus(betAmount.times(betMultipliers["9"]));
        break;
      case "n":
        small = small.plus(betAmount.times(betMultipliers["n"]));
        break;
      case "l":
        big = big.plus(betAmount.times(betMultipliers["l"]));
        break;
      case "d":
        red = red.plus(betAmount.times(betMultipliers["d"]));
        break;
      case "x":
        green = green.plus(betAmount.times(betMultipliers["x"]));
        break;
      case "t":
        violet = violet.plus(betAmount.times(betMultipliers["t"]));
        break;
      default:
        break;
    }
  });

  const totalPayouts = {
    0: zero,
    1: one,
    2: two,
    3: three,
    4: four,
    5: five,
    6: six,
    7: seven,
    8: eight,
    9: nine,
    n: small,
    l: big,
    d: red,
    x: green,
    t: violet,
  };

  function updateManyPayouts() {
    smallNumbers.forEach((num) => {
      totalPayouts[num] = totalPayouts[num].plus(totalPayouts["n"]);
    });
    bigNumbers.forEach((num) => {
      totalPayouts[num] = totalPayouts[num].plus(totalPayouts["l"]);
    });
    greenNumbers.forEach((num) => {
      totalPayouts[num] = totalPayouts[num].plus(totalPayouts["x"]);
    });
    redNumbers.forEach((num) => {
      totalPayouts[num] = totalPayouts[num].plus(totalPayouts["d"]);
    });
    violetNumbers.forEach((num) => {
      totalPayouts[num] = totalPayouts[num].plus(totalPayouts["t"]);
    });
  }

  // Call the function to update many payouts
  updateManyPayouts();

  // Filter out the numbers (0-9) with the lowest value
  const lowestValue = Decimal.min(
    ...Object.entries(totalPayouts)
      .filter(([key, _]) => !isNaN(key))
      .map(([_, value]) => value)
  );

  const numbersWithLowestValue = Object.keys(totalPayouts).filter(
    (key) => !isNaN(key) && totalPayouts[key].equals(lowestValue)
  );

  // Select a random number from those with the lowest value
  const randomLowestValueNumber =
    numbersWithLowestValue[
      Math.floor(Math.random() * numbersWithLowestValue.length)
    ];

  return randomLowestValueNumber;
};
