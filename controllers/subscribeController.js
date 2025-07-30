import { sendSubscriptionEmail } from "../utils/sendEmailSubscription.js";

export const subscribed = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send("Email is required");
  }
  console.log(email);
  // Get the current date and time for the subscription
  const subscriptionDate = new Date().toLocaleString();
  // Call the function to send both emails
  sendSubscriptionEmail(email, subscriptionDate);
  res.status(200).send("Subscription successful");
};
