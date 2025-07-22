interface GuessResult {
  isCorrect: boolean;
  guessPercentage: number;
  actualWinRate: number;
  accuracy: number;
  points: number;
  message: string;
}

interface RangeGuessResult extends GuessResult {
  guessRange: [number, number];
  isWithinRange: boolean;
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

export function evaluateRangeGuess(
  guessRange: [number, number],
  actualWinRate: number
): RangeGuessResult {
  // Check if actual result is within the range
  const isWithinRange = actualWinRate >= guessRange[0] && actualWinRate <= guessRange[1];
  
  // Calculate range size
  const rangeSize = guessRange[1] - guessRange[0];
  
  // Calculate the center of the range for accuracy scoring
  const rangeCenter = (guessRange[0] + guessRange[1]) / 2;
  const centerAccuracy = 100 - Math.abs(rangeCenter - actualWinRate);
  
  // For endless mode, being within range is success
  const isCorrect = isWithinRange;
  
  // Calculate points based on range size and whether it's correct
  let points = 0;
  if (isCorrect) {
    // Base points for being within range
    points = 100;
    
    // Bonus points for smaller ranges (harder to hit)
    if (rangeSize <= 20) {
      points += 100; // Very tight range
    } else if (rangeSize <= 25) {
      points += 75; // Tight range
    } else if (rangeSize <= 30) {
      points += 50; // Moderate range
    } else if (rangeSize <= 40) {
      points += 25; // Wide range
    }
    
    // Additional bonus if actual result is near the center of the range
    if (Math.abs(rangeCenter - actualWinRate) <= 5) {
      points += 25; // Centered prediction bonus
    }
  }
  
  // Generate message based on result
  let message = '';
  if (isCorrect) {
    if (rangeSize <= 20) {
      message = 'Perfect! You nailed it with a tight range!';
    } else if (rangeSize <= 25) {
      message = 'Excellent! Great prediction with a challenging range!';
    } else if (rangeSize <= 30) {
      message = 'Well done! Your range captured the result!';
    } else {
      message = 'Good job! The result fell within your range!';
    }
  } else {
    const distanceFromRange = actualWinRate < guessRange[0] 
      ? guessRange[0] - actualWinRate 
      : actualWinRate - guessRange[1];
      
    if (distanceFromRange <= 5) {
      message = 'So close! Just missed your range by a bit.';
    } else if (distanceFromRange <= 10) {
      message = 'Not quite! Your range was nearby though.';
    } else if (distanceFromRange <= 20) {
      message = 'Your range was off by a fair amount.';
    } else {
      message = 'Your range was quite far from the actual result.';
    }
  }
  
  return {
    isCorrect,
    guessPercentage: rangeCenter,
    guessRange,
    actualWinRate,
    accuracy: centerAccuracy,
    points,
    message,
    isWithinRange
  };
}