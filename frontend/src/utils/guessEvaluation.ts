interface GuessResult {
  isCorrect: boolean;
  guessPercentage: number;
  actualWinRate: number;
  accuracy: number;
  points: number;
  message: string;
}

export function evaluateGuess(
  guessPercentage: number,
  actualWinRate: number
): GuessResult {
  // Calculate accuracy (how close the guess was)
  const accuracy = 100 - Math.abs(guessPercentage - actualWinRate);
  
  // A guess is correct if it's within 10% of the actual win rate
  const isCorrect = Math.abs(guessPercentage - actualWinRate) <= 10;
  
  // Calculate points based on accuracy
  let points = 0;
  if (isCorrect) {
    // Base points for being within 10%
    points = 100;
    
    // Bonus points for being very close
    if (accuracy >= 95) {
      points += 50; // Perfect or near-perfect guess
    } else if (accuracy >= 90) {
      points += 25; // Very close guess
    }
  }
  
  // Generate message based on accuracy
  let message = '';
  if (accuracy >= 99) {
    message = 'Perfect prediction! Incredible!';
  } else if (accuracy >= 95) {
    message = 'Excellent prediction! Almost perfect!';
  } else if (accuracy >= 90) {
    message = 'Great prediction! Very close!';
  } else if (isCorrect) {
    message = 'Good prediction! Within 10%!';
  } else if (accuracy >= 80) {
    message = 'Not bad, but not quite close enough.';
  } else if (accuracy >= 70) {
    message = 'You were off by a fair amount.';
  } else if (accuracy >= 50) {
    message = 'Your prediction was quite far off.';
  } else {
    message = 'Your prediction was way off the mark.';
  }
  
  return {
    isCorrect,
    guessPercentage,
    actualWinRate,
    accuracy,
    points,
    message
  };
}