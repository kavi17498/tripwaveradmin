export const sleep = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export const sometimesFail = (rate = 0.05) => {
  if (Math.random() < rate) {
    throw new Error("Something went wrong. Please try again.");
  }
};
