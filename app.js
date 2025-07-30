// library imoprts
import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import "dotenv/config";
import cors from "cors";
import {
  initSocketController,
  wingoSocketController,
} from "./controllers/socketController.js";
const Port = process.env.PORT || 5000;
// code imports
import { router as authRouter } from "./routes/authRouter.js";
import { router as userRouter } from "./routes/userRouter.js";
import { router as aviatorRouter } from "./routes/aviatorRouter.js";
import { router as adminRouter } from "./routes/adminRouter.js";
import { router as wingoRouter } from "./routes/wingoRouter.js";
import { router as subscribeRouter } from "./routes/subscribeRouter.js";

const app = express();
export const server = createServer(app);

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3002",
    "http://localhost:3000",
  ],
  methods: ["GET,HEAD,PUT,PATCH,POST,DELETE"],
  credentials: true,
};

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      // "https://admin.revoridegame.com",
      "http://localhost:3002",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// app.options("*", cors());
// // Define the list of allowed origins
// const allowedOrigins = ["http://127.0.0.1:3000/","http://localhost:8000/","*",'http://localhost:3001/','http://localhost:3000/','https://api.ekqr.in/api/create_order','https://aviator.metablocktechnologies.org', 'https://admin.metablocktechnologies.org'];

// // Enable CORS for all routes with the specified allowed origins
// app.use(cors({
//   origin: (origin, callback) => {
//     // Check if the origin is in the list of allowed origins
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   credentials: true,
// }));
// Allow only your frontend domain
// app.use(
//   cors({
//     origin: "https://revoridegame.com", // your frontend domain
//     methods: ["GET", "POST"],
//     credentials: true,
//   })
// );

// use body-parser
app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
// Initialize the Socket.IO controller

initSocketController(io);
wingoSocketController(io);
//=============serving first file...=========

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Development logging
// if (process.env.NODE_ENV === "development") {
//   app.use(morgan("dev"));
// }
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "/index.html"));
});

//  use of routing
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/bet", aviatorRouter);
app.use("/admin", adminRouter);
app.use("/wingo", wingoRouter);
app.use("/email", subscribeRouter);

// listening to the server
server.listen(Port, () => {
  console.log(`server running at http://localhost:${Port}`);
});
