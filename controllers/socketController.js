import prisma from "../prisma/prisma.js";
import {
  generateRandomNumber,
  updateSingleValues,
} from "../utils/randomGenerate.js";
import { millisecondsToDateString } from "../utils/millisecondsToDateString.js";
import NodeCache from "node-cache";
import { addWinGo } from "./wingoController.js";

// created io instance
export const wingoSocketController = async (io) => {
  function startFormattedReverseCountdown(duration, room) {
    let remainingTimeInSeconds = duration * 60;
    const intervalId = setInterval(async () => {
      if (remainingTimeInSeconds >= 0) {
        io.to(room).emit(`countdown${duration}`, remainingTimeInSeconds);
        remainingTimeInSeconds--;
      } else {
        clearInterval(intervalId);
        io.to(room).emit(`countdown${duration}`, 0);
        let result;
        if (duration == 1) {
          result = await addWinGo(1);
        } else if (duration == 3) {
          result = await addWinGo(3);
        } else if (duration == 5) {
          result = await addWinGo(5);
        } else if (duration == 10) {
          result = await addWinGo(10);
        }
        io.to(room).emit(`result${duration}`, result);
        startFormattedReverseCountdown(duration, room);
      }
    }, 1000);
  }
  io.on("connection", (socket) => {
    socket.join("wingoRoom");
  });
  startFormattedReverseCountdown(1, "wingoRoom");
  startFormattedReverseCountdown(3, "wingoRoom");
  startFormattedReverseCountdown(5, "wingoRoom");
  startFormattedReverseCountdown(10, "wingoRoom");
};

export const initSocketController = async (io) => {
  let gameStarted = false;
  let connectedUsers = new Set();
  let crashedValue;
  let count = 0;
  let lastCrashedValues = [];
  let adminCrashedTime = 0;

  const updateArray = (arr, newValue) => {
    arr.push(newValue);
    if (arr.length > 50) arr.shift();
    lastCrashedValues = arr;
  };
  io.on("resetCount", () => {
    count = 0;
    adminCrashedTime = 1;
  });
  const emitGameUpdates = async (initialValue, intervalId) => {
    adminCrashedTime = 0;
    clearInterval(intervalId);
    gameStarted = false;
    updateArray(lastCrashedValues, initialValue);
    io.to("aviatorRoom").emit("lastCrashed", lastCrashedValues);
    io.to("aviatorRoom").emit("planeCounter", 0);
    io.to("aviatorRoom").emit("gameStarted", false);
    await prisma.autoaviator.deleteMany();
    setTimeout(crashedPlaneNumber, 11000);
  };
  const startInterval = (initialValue) => {
    gameStarted = true;
    let intervalId = setInterval(async () => {
      if (initialValue <= crashedValue && !adminCrashedTime && gameStarted) {
        // initialValue = parseFloat(initialValue) + 0.01;
        if (initialValue < 2) {
          initialValue = parseFloat(initialValue) + 0.01;
        } else if (initialValue >= 2 && initialValue < 6) {
          initialValue =
            parseFloat(initialValue) + getRandomInRange(0.01, 0.06);
        } else if (initialValue >= 6 && initialValue < 10) {
          initialValue = parseFloat(initialValue) + getRandomInRange(0.03, 0.1);
        } else if (initialValue >= 10 && initialValue < 100) {
          initialValue = parseFloat(initialValue) + getRandomInRange(0.1, 1);
        } else if (initialValue >= 100 && initialValue < 1000) {
          initialValue = parseFloat(initialValue) + getRandomInRange(1, 10);
        } else if (initialValue >= 1000 && initialValue < 5000) {
          initialValue = parseFloat(initialValue) + getRandomInRange(10, 50);
        } else if (initialValue >= 5000 && initialValue < 10000) {
          initialValue = parseFloat(initialValue) + getRandomInRange(50, 100);
        } else if (initialValue >= 10000) {
          initialValue = parseFloat(initialValue) + getRandomInRange(100, 200); // Adjust as necessary for values above 10000
        }
        io.to("aviatorRoom").emit("gameStarted", true);
        io.to("aviatorRoom").emit("planeCounter", initialValue.toFixed(2));
      } else {
        await emitGameUpdates(initialValue.toFixed(2), intervalId);
      }
    }, 200);
  };
  const startCountdownInterval = async (initialValue) => {
    gameStarted = true;
    let startTime = new Date().getTime();
    let getTotalAmount = await getTotalBetAmount();
    let crashedPlaneSettings = await prisma.crashedplane.findFirst({});
    let { ml, mh, da } = crashedPlaneSettings;
    let newCrashedValue = mh;
    let intervalId = setInterval(async () => {
      if (!adminCrashedTime && initialValue <= newCrashedValue && gameStarted) {
        // initialValue = parseFloat(initialValue) + 0.01;
        if (initialValue < 2) {
          initialValue = parseFloat(initialValue) + 0.01;
        } else if (initialValue >= 2 && initialValue < 6) {
          initialValue =
            parseFloat(initialValue) + getRandomInRange(0.01, 0.06);
        } else if (initialValue >= 6 && initialValue < 10) {
          initialValue = parseFloat(initialValue) + getRandomInRange(0.03, 0.1);
        } else if (initialValue >= 10 && initialValue < 100) {
          initialValue = parseFloat(initialValue) + getRandomInRange(0.1, 1);
        } else if (initialValue >= 100 && initialValue < 1000) {
          initialValue = parseFloat(initialValue) + getRandomInRange(1, 10);
        } else if (initialValue >= 1000 && initialValue < 5000) {
          initialValue = parseFloat(initialValue) + getRandomInRange(10, 50);
        } else if (initialValue >= 5000 && initialValue < 10000) {
          initialValue = parseFloat(initialValue) + getRandomInRange(50, 100);
        } else if (initialValue >= 10000) {
          initialValue = parseFloat(initialValue) + getRandomInRange(100, 200); // Adjust as necessary for values above 10000
        }
        io.to("aviatorRoom").emit("planeCounter", initialValue.toFixed(2));
        io.to("aviatorRoom").emit("gameStarted", true);
      } else {
        await emitGameUpdates(initialValue.toFixed(2), intervalId);
      }
      const distributedAmount = Math.round(
        (getTotalAmount * (100 - Number(da))) / 100
      );
      const totalWithdrawAmount = await getWithdrawAmount(startTime);
      if (distributedAmount < totalWithdrawAmount) {
        newCrashedValue = 0;
      }
    }, 200);
  };

  const crashedPlaneNumber = async () => {
    crashedValue =
      count === 0
        ? await generatePlaneCrashed(0)
        : await generatePlaneCrashed(1);
    io.to("aviatorRoom").emit("crashedValue", crashedValue);
    if (count < 3) startInterval(1.0);
    else startCountdownInterval(1.0);
  };
  io.on("connection", (socket) => {
    socket.on("resetCount", () => (count = 0));
    socket.on("crashedTime", (time) => {
      adminCrashedTime = time;
    });
    let clientId = socket.handshake.query.clientId || "0000000000";
    if (clientId !== "0000000000") connectedUsers.add(clientId);
    socket.join("aviatorRoom");
    socket.emit("lastCrashed", lastCrashedValues);
    socket.on("betPlaced", (betCount) => (count += betCount));
    socket.on(
      "withdrawCount",
      (withdrawCount) => (count = Math.max(count - withdrawCount, 0))
    );
    socket.on("disconnect", () =>
      connectedUsers.delete(socket.handshake.query.clientId)
    );
  });
  crashedPlaneNumber();
};

// Main Aviator Function
const generatePlaneCrashed = async (length) => {
  const { nl, nh, sl, sh, sp, sm } = await prisma.crashedplane.findFirst({});
  return length === 0
    ? generateRandomNumber(Number(nl), Number(nh))
    : updateSingleValues(Number(sp), Number(sm), Number(sh), sl);
};

const getTotalBetAmount = async () => {
  try {
    const betData = await prisma.autoaviator.findMany();
    return betData.reduce((sum, item) => sum + item.betAmount, 0);
  } catch (err) {
    console.error(err);
    return 0;
  }
};
const cache = new NodeCache({ stdTTL: 5 });
const getWithdrawAmount = async (startTime) => {
  const cacheKey = "totalwithdrawamount";
  const cachedValue = cache.get(cacheKey);
  if (cachedValue) return cachedValue;
  try {
    const withdrawTime = millisecondsToDateString(startTime);
    const betData = await prisma.autoaviator.findMany({
      where: {
        withdrawAmount: { not: 0 },
        withdrawTime: { gte: withdrawTime },
      },
    });
    const withdrawAmount = betData.reduce(
      (sum, item) => sum + item.withdrawAmount,
      0
    );
    cache.set(cacheKey, withdrawAmount, 5); // Cache for 10 minutes
    return withdrawAmount;
  } catch (err) {
    console.error(err);
    return 0;
  }
};
function getRandomInRange(min, max) {
  const randomFloat = min + Math.random() * (max - min);
  return parseFloat(randomFloat.toFixed(2));
}
function padTime(number) {
  return number < 10 ? `0${number}` : number.toString();
}
