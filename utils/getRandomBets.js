export function getRandomBets(count) {
  const bets = [];

  function generateRandomPhoneNumber() {
    // First digit should be between 6 and 9
    const firstDigit = Math.floor(Math.random() * 4) + 6;
    // Remaining 9 digits can be any number between 0 and 9
    const remainingDigits = Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(9, "0");
    return firstDigit.toString() + remainingDigits;
  }

  // Function to generate a random date within a range
  function generateRandomDate(start, end) {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
  }

  for (let i = 1; i <= count; i++) {
    const id = i.toString();
    const phone = generateRandomPhoneNumber();
    // Generate betAmount rounded to nearest 10 between 50 and 250
    const betAmount = Math.round((Math.random() * 200 + 50) / 10) * 10;

    const betTime = generateRandomDate(new Date(2022, 0, 1), new Date()); // Random date between January 1, 2022, and today

    // Generate withdrawTime only 50% of the time
    const withdrawTime =
      Math.random() < 0.5 ? generateRandomDate(betTime, new Date()) : null;

    // Adjust withdrawAmount calculation here
    let withdrawAmount;
    if (withdrawTime) {
      // Initially calculate a withdrawAmount that ensures the multiplier does not exceed 1.4
      let potentialWithdrawAmount =
        Math.round((betAmount + Math.random() * 150 + 10) / 10) * 10;
      let potentialMultiplier = potentialWithdrawAmount / betAmount;

      // If potentialMultiplier exceeds 1.4, adjust the withdrawAmount downwards
      if (potentialMultiplier > 1.08 || potentialMultiplier == 1.0) {
        withdrawAmount = Math.round((betAmount * 1.05) / 10) * 10;
      } else {
        withdrawAmount = potentialWithdrawAmount;
      }
    } else {
      withdrawAmount = 0;
    }

    const multiplier =
      withdrawAmount > 0 ? (withdrawAmount / betAmount).toFixed(2) : 0;

    bets.push({
      id: id,
      phone: phone,
      betAmount: betAmount,
      withdrawAmount: withdrawAmount,
      multiplier: multiplier,
      betTime: betTime.toISOString(),
      withdrawTime: withdrawTime ? withdrawTime.toISOString() : null,
    });
  }

  return bets;
}
