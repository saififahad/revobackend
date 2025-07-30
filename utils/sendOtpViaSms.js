async function sendOtpViaSMS(phone, otp) {
  const url = `https://www.fast2sms.com/dev/bulkV2?authorization=MbgqPj8ORiVHruxmAED7n2aGlN4vW3o5LX90cdBf1wJQTKspYt480rC9i3ANUQa6oZVhgTWj1XcBF7ew&route=otp&variables_values=${otp}&flash=0&numbers=${phone}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
    console.error("Error sending OTP via SMS:", error);
    return false;
  }
}

export default sendOtpViaSMS;
