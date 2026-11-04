import type { PlayerState, TimeOfDay } from '../types';

const timeCycle: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];

export function advanceTime(state: PlayerState, steps: number = 1): PlayerState {
  let nextTime = state.time_of_day;
  let dayNumber = state.day_number;
  let hunger = state.hunger;
  let fatigue = state.fatigue;

  for (let index = 0; index < steps; index += 1) {
    const currentIndex = timeCycle.indexOf(nextTime);
    const updatedTime = timeCycle[(currentIndex + 1) % timeCycle.length];

    if (nextTime === 'night' && updatedTime === 'morning') {
      dayNumber += 1;
    }

    nextTime = updatedTime;
    hunger = Math.min(100, hunger + 8);
    fatigue = Math.min(100, fatigue + 6);
  }

  return {
    ...state,
    time_of_day: nextTime,
    day_number: dayNumber,
    hunger,
    fatigue
  };
}

export function timeLabel(time: TimeOfDay): string {
  switch (time) {
    case 'morning':
      return 'the early morning';
    case 'afternoon':
      return 'the afternoon';
    case 'evening':
      return 'the evening';
    case 'night':
      return 'deep in the night';
  }
}
