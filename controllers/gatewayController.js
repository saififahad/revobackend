import prisma from "../prisma/prisma.js";
import { successResponse, failedResponse } from "../utils/response.js";
import "dotenv/config";
import { ethers } from "ethers";

import Web3 from "web3";
import contractABI from "./contractABI.js";
// const NXBTContractAddress = "0x94651A5a28D43569bDA103F38f4F27aBb8499BcB";
const USDTContractAddress = process.env.USDT_TOKEN_KEY; // USDT Token Address on BSC
// const REVContractAddress = "0x78365433F897F1303f6c7D8a3fbe3D6dae984C68";
const REVContractAddress = process.env.REV_TOKEN_KEY;

// const NXBTChainParams = {
//   rpcUrl: "https://rpc-nodes-sigma.nexablockscan.io",
//   chainId: 9025,
//   networkId: 9025,
//   blockExplorerUrl: "https://nexablockscan.io",
// };

const BEP20ChainParams = {
  rpcUrl: "https://bsc-dataseed.binance.org/",
  chainId: 56,
  networkId: 56,
  blockExplorerUrl: "https://bscscan.com",
  decimal: 18,
};

const ERC20ChainParams = {
  rpcUrl: "https://ethereum.publicnode.com",
  chainId: 1,
  networkId: 1,
  blockExplorerUrl: "https://etherscan.io",
  decimal: 18,
};
// const ERC20ChainParams = {
//   rpcUrl: "https://bsc-testnet-rpc.publicnode.com/",
//   chainId: 97,
//   networkId: 97,
//   blockExplorerUrl: "https://etherscan.io",
// };

// const web3REV = new Web3(ERC20ChainParams.rpcUrl);
const web3BEP20 = new Web3(BEP20ChainParams.rpcUrl);

// Setup provider (using Infura as an example)
const providerRev = new ethers.JsonRpcProvider(ERC20ChainParams.rpcUrl);
const providerBep20 = new ethers.JsonRpcProvider(BEP20ChainParams.rpcUrl);

// const REVContract = new web3REV.eth.Contract(contractABI, REVContractAddress);
const USDTContract = new web3BEP20.eth.Contract(
  contractABI,
  USDTContractAddress
);

// ERC20 Token ABI
const erc20ABI = [
  "function transfer(address recipient, uint256 amount) public returns (bool)",
];

export const performWithdrawal = async (req, res) => {
  const { points, amount, cur, type, sender, receiver, name_user, phone } =
    req.body;
  try {
    const email = req.email;
    if (!amount || !points || !cur || !type || !sender || !receiver) {
      return res.status(400).json({ error: "Invalid input!" });
    }
    const user = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });
    if (amount > user?.money) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    const referDetails = await prisma.refer.findFirst({
      select: { privatekey: true },
    });
    if (!referDetails) {
      return failedResponse(res, "Key Details Not Found");
    }

    const privateKey = referDetails?.privatekey;
    // Create a wallet instance from the private key
    const walletRev = new ethers.Wallet(privateKey, providerRev);
    const walletBep20 = new ethers.Wallet(privateKey, providerBep20);

    // let web3, contract, txObject, account, gas, gasPrice;
    let txReceipt;

    if (cur === "REV") {
      // web3 = web3REV;
      // contract = REVContract;
      // account = web3.eth.accounts.privateKeyToAccount(privateKey);
      // web3.eth.accounts.wallet.add(account);

      // gas = await contract.methods
      //   .transfer(
      //     "0x1441B4768c4933797D439Beca7bc765521186BBB",
      //     web3.utils.toWei(amount, "ether")
      //   )
      //   .estimateGas({ from: account.address });
      // gasPrice = await web3.eth.getGasPrice();
      // console.log(gas, gasPrice, "gasPrice");

      // txObject = {
      //   from: account.address,
      //   to: REVContractAddress,
      //   data: contract.methods
      //     .transfer(
      //       "0x1441B4768c4933797D439Beca7bc765521186BBB",
      //       web3.utils.toWei(amount, "ether")
      //     )
      //     .encodeABI(),
      //   gas: 200000,
      //   gasPrice,
      // };
      // console.log(web3.utils.toWei(amount, "ether"), "amount");
      // console.log(txObject, "Transaction object");

      // Create a contract instance for the ERC20 token
      const tokenContractRev = new ethers.Contract(
        process.env.REV_TOKEN_KEY,
        erc20ABI,
        walletRev
      );

      // Convert the amount to the correct token decimals
      const amountInWei = ethers.parseUnits(amount.toString(), 18);

      // Send the transaction REV
      const tx = await tokenContractRev.transfer(receiver, amountInWei);

      console.log("Transaction sent! Waiting for confirmation...");
      // Wait for the transaction to be mined
      txReceipt = await tx.wait();
    } else if (cur === "USDT") {
      // web3 = web3BEP20;
      // contract = USDTContract;
      // account = web3.eth.accounts.privateKeyToAccount(privateKey);
      // web3.eth.accounts.wallet.add(account);

      // gas = await contract.methods
      //   .transfer(receiver, web3.utils.toWei(amount, "ether")) // USDT often uses 6 decimals
      //   .estimateGas({ from: account.address });
      // gasPrice = await web3.eth.getGasPrice();

      // txObject = {
      //   from: account.address,
      //   to: USDTContractAddress,
      //   data: contract.methods
      //     .transfer(receiver, web3.utils.toWei(amount, "ether"))
      //     .encodeABI(),
      //   gas: 200000,
      //   gasPrice,
      // };
      const tokenContractBep20 = new ethers.Contract(
        process.env.USDT_TOKEN_KEY,
        erc20ABI,
        walletBep20
      );

      // Convert the amount to the correct token decimals
      const amountInWei = ethers.parseUnits(amount.toString(), 18);

      // Send the transaction REV
      const tx = await tokenContractBep20.transfer(receiver, amountInWei);

      console.log("Transaction sent! Waiting for confirmation...");
      // Wait for the transaction to be mined
      txReceipt = await tx.wait();
    } else {
      return failedResponse(res, "Unsupported currency!");
    }
    // const balanceBefore = await contract.methods
    //   .balanceOf(account.address)
    //   .call();
    // const signedTx = await web3.eth.accounts.signTransaction(
    //   txObject,
    //   privateKey
    // );
    // console.log(signedTx, "SignedTx");
    // const txReceipt = await web3.eth.sendSignedTransaction(
    //   signedTx.rawTransaction
    // );
    // console.log(txReceipt, "txReceipt");
    // const balanceAfter = await contract.methods
    //   .balanceOf(account.address)
    //   .call();
    if (txReceipt.status) {
      await prisma.users.update({
        where: {
          email: email,
        },
        data: {
          money: {
            decrement: Number(points),
          },
        },
      });
      await prisma.transaction.create({
        data: {
          points: Number(points),
          type,
          cur,
          email,
          receiver,
          sender,
          name_user,
          phone,
          token: Number(amount),
        },
      });
      return res.status(200).json({
        status: true,
        message: "Withdrawal successful.",
        txHash: txReceipt.transactionHash,
        explorerLink: `${
          cur === "REV"
            ? ERC20ChainParams.blockExplorerUrl
            : BEP20ChainParams.blockExplorerUrl
        }/tx/${txReceipt.transactionHash}`,
      });
    }
    return failedResponse(res, "Something went wrong!");
  } catch (error) {
    console.log(error);
    if (error.code === 310) {
      return failedResponse(
        res,
        "Something Went Wrong, Please Try Again Later"
      );
    }
    return (
      res
        // .status(500)
        // .json({ status: false, message: error.reason || error.message });
        .status(500)
        .json({
          status: false,
          message: "Something went wrong please try again later!",
        })
    );
  }
};

export const depositFunds = async (req, res) => {
  try {
    const email = req.email;
    if (!email) {
      return failedResponse(res, "Email Not Found");
    }

    const { points, cur, type, receiver, sender, name_user, phone, token } =
      req.body;
    if (!points || !cur || !type || !receiver || !sender) {
      return failedResponse(res, "Invalid Input");
    }
    const user = await prisma.users.findUnique({ where: { email: email } });
    const parentCode = user.invite;
    await prisma.users.update({
      where: {
        email: email,
      },
      data: {
        deposit: {
          increment: Number(points),
        },
      },
    });
    await prisma.transaction.create({
      data: {
        points: Number(points),
        type,
        cur,
        email,
        receiver,
        sender,
        name_user,
        phone,
        token: Number(token),
      },
    });
    const allDeposits = await prisma.transaction.findMany({
      where: { type: "d" },
    });
    const totalDeposit = allDeposits.reduce((acc, cur) => acc + cur.points, 0);
    const referDetails = await prisma.refer.findMany();
    const mda = referDetails[0].mda;
    let parentCommission = referDetails[0].parentCommission;
    let childrenCommission = referDetails[0].childrenCommission;
    parentCommission = Math.floor((points * parentCommission) / 100);
    childrenCommission = Math.floor((points * childrenCommission) / 100);
    const parentUser = await prisma.users.findFirst({
      where: { code: parentCode },
    });
    if (parentUser) {
      let pendingReferralsArray = parentUser.pendingReferrals
        ? JSON.parse(parentUser.pendingReferrals)
        : [];
      if (
        totalDeposit &&
        totalDeposit >= mda &&
        pendingReferralsArray.includes(email)
      ) {
        pendingReferralsArray.pop(email);
        let approvedReferralsArray = parentUser.approvedReferrals
          ? JSON.parse(parentUser.approvedReferrals)
          : [];
        approvedReferralsArray.push(email);
        const updatedPendingReferrals = JSON.stringify(pendingReferralsArray);
        const updatedApproveReferrals = JSON.stringify(approvedReferralsArray);
        const earnedCommission =
          parentUser.earnedCommission + Number(parentCommission);
        const pendingCommission =
          parentUser.pendingCommission - Number(parentCommission);
        await prisma.users.updateMany({
          where: { code: parentCode },
          data: {
            money: {
              increment: Number(parentCommission),
            },
            pendingCommission: pendingCommission,
            earnedCommission: earnedCommission,
            approvedReferrals: updatedApproveReferrals,
            pendingReferrals: updatedPendingReferrals,
          },
        });
        await prisma.transaction.create({
          data: {
            points: Number(parentCommission),
            type: "d",
            cur: "USD",
            email: parentUser.email,
            receiver: "Referral Bonus",
            sender: "Referral Bonus",
            name_user: parentUser.name_user,
            phone: parentUser.phone,
            token: 0,
          },
        });
        await prisma.users.updateMany({
          where: {
            email: email,
          },
          data: {
            money: {
              increment: Number(childrenCommission),
            },
          },
        });
        await prisma.transaction.create({
          data: {
            points: Number(childrenCommission),
            type: "d",
            cur: "USD",
            email,
            receiver: "Referral Bonus",
            sender: "Referral Bonus",
            name_user,
            phone,
            token: 0,
          },
        });
      }
    }

    return successResponse(res, "Funds successfully deposited");
  } catch (error) {
    console.log(error);
    console.error("Failed to deposit funds: ", error);
    return failedResponse(res, "something Went wrong");
  }
};
