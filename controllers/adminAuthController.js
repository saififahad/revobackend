import prisma from "../prisma/prisma.js";
import md5 from "md5";
import jwt from "jsonwebtoken";
import "dotenv/config.js";
import catchAsync from "../utils/catchAsync.js";
import { failedResponse } from "../utils/response.js";
// Secret key to sign JWT tokens
const secretKey = process.env.JWT_SECRET_KEY;

export const login = async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      message: "Bad Request: Missing required parameters",
      status: false,
    });
  }

  try {
    const admin = await prisma.admin.findFirst({
      where: {
        username: String(username),
        password: String(md5(password)),
      },
    });

    if (!admin) {
      return res.status(401).json({
        message: "incorrect username or password",
        status: false,
      });
    }

    const token = jwt.sign({ username: admin.username }, secretKey, {
      expiresIn: "2h",
    });

    return res.status(200).json({
      message: "Login successful",
      status: true,
      token: token,
    });
  } catch (error) {
    console.log(error);
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
};

export const changepassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(401).json({
        message: "Invalid request!",
        status: false,
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(401).json({
        message: "confirm password and new Password not matched",
        status: false,
      });
    }
    const admin = await prisma.admin.findFirst({
      where: {
        password: String(md5(oldPassword)),
      },
    });

    if (!admin || admin.password !== md5(oldPassword)) {
      return res.status(401).json({
        message: "Old password is not correct",
        status: false,
      });
    }

    await prisma.admin.updateMany({
      where: {
        password: String(md5(oldPassword)),
      },
      data: {
        password: String(md5(newPassword)),
        visiblepassword: newPassword,
      },
    });

    return res.status(200).json({
      message: "Password changed successfully",
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

export const createAdminAccount = async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingAdmin = await prisma.admin.findFirst({
      where: {
        username: String(username),
      },
    });

    if (existingAdmin) {
      return res.status(400).json({
        message: "Username already exists",
        status: false,
      });
    }

    const newAdmin = await prisma.admin.create({
      data: {
        username: String(username),
        password: String(md5(password)),
      },
    });

    return res.status(201).json({
      message: "Admin account created successfully",
      status: true,
      admin: newAdmin,
    });
  } catch (error) {
    console.log(error);
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
};

// ===== protect ======
export const adminProtect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  const decoded = jwt.decode(token, process.env.JWT_SECRET_KEY);
  if (!decoded) {
    return failedResponse(res, "Token Error");
  }
  const currentUser = await prisma.admin.findMany({
    where: { username: String(decoded.username) },
  });
  if (!currentUser.length) {
    return res.status(400).json({
      message: "admin not found",
      status: false,
    });
  }
  req.user = currentUser;
  next();
});
