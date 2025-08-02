import prisma from "./prisma/prisma.js";
import {
  randomNumber,
  randomString,
  timeCreate,
} from "./utils/randomGenerate.js";
import md5 from "md5";
import "dotenv/config";

function generateUniqueId() {
  // Get the current date and time
  const now = new Date();

  // Format the date and time as YYMMDDHHMMSS (12 digits)
  const year = String(now.getFullYear()).slice(-2); // Get last 2 digits of the year
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const timestamp = year + month + day + hours + minutes + seconds;

  // Generate a random digit to ensure uniqueness (1 digit)
  const uniqueDigit = Math.floor(Math.random() * 10);

  // Combine timestamp and unique digit to form a 13-digit number
  const uniqueId = timestamp + uniqueDigit;

  return uniqueId;
}
const createWingo = async () => {
  console.log(process.env.PRIVATE_KEY);
  // let code = randomString(5) + randomNumber(10000, 99999);
  let code = "vCEEH56455";
  let inviteCode = "eVwFU76226";
  let time = timeCreate();
  let id_user = randomNumber(10000, 99999);
  const password = md5("12345678");
  try {
    // await prisma.crashedplane.create({});
    // await prisma.refer.create({});
    // await prisma.bonus.create({});
    await prisma.crashedplane.create({});
    await prisma.refer.create({
      data: {
        id: 1,
        parentCommission: 50,
        notReferCommission: 0,
        mwa: 1,
        usdt: 80,
        // address: "0xE15E7Be69559E4F7c830B1958F22369B14128B95", old rev token address
        address: "0x70f706789724138bE9dDCECe934d514dcbD370A9",
        privatekey: process.env.PRIVATE_KEY,
        mda: 1,
        rev: 1,
        childrenCommission: 100,
      },
    });
    await prisma.bonus.create({});
    await prisma.users.create({
      data: {
        id_user: id_user,
        email: "fahad@mozilit.com",
        phone: "7983467568",
        password: password,
        code: code,
        invite: inviteCode,
        name_user: "fahad saifi",
        money: 50,
        status: 1,
        time: time,
        veri: 1,
      },
    });
    // await prisma.wingo.deleteMany({});
    await prisma.betwingo.deleteMany({});
    await prisma.wingo.deleteMany({ where: { status: 0 } });
    //   await prisma.betwingo.deleteMany({});
    const games = ["wingo10", "wingo5", "wingo3", "wingo1"];
    for (const game of games) {
      await prisma.wingo.create({
        data: {
          period: generateUniqueId(),
          game: game,
          result: 6,
          status: 0,
        },
      });
    }
    console.log("Create Success Database");
  } catch (error) {
    console.log(error);
    console.error("Error in CreateWingo function:", error);
  }
};

createWingo();
