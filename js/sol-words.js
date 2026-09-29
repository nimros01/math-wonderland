// The small sentences under each solution step, for parents and kids who read.
// All of them live here, keyed by name, so another language can be added as one more block.
// {a} in a sentence is filled in with that value.
const WORDS = {
  en: {
    // adding and taking away
    'frames': 'Put the dots in ten-frames.',
    'fullFrames': 'Each full frame is 10. Then count the rest.',
    'countDots': 'Count the dots one by one.',
    'fill10': 'Fill the first frame up to 10: {a} more.',
    'ten+': '10 and {a} more make {b}.',
    'toTen': 'Add {a} first to reach {b}, a whole ten.',
    'tenMore': '{b} and {a} more make {c}.',
    'downToTen': 'Take away {a} first to get down to {b}, a whole ten.',
    'double': 'A double: the same number twice.',
    'nearDouble': '{a} + {b} is one more than the double {a} + {a}.',
    'hops': 'Start at {a} and hop {b} forward.',
    'hopsBack': 'Start at {a} and hop {b} back.',
    'split': 'Split both numbers into tens and ones.',
    'tens': 'Add the tens.',
    'ones': 'Add the ones.',
    'newTen': 'Ten ones make a new ten. {a} ones stay.',
    'together': 'Put the tens and ones together.',
    'tensJump': 'Jump by tens.',
    'crossOut': 'Take {a} away. Count what is left.',
    'backTo10': 'Take away {a} first to get down to 10.',
    'thenRest': 'Then take away the other {a}.',
    'breakTen': 'Not enough ones. Break a ten into 10 ones.',
    'subOnes': 'Take away the ones.',
    'subTens': 'Take away the tens.',
    'countUp': 'Count up from {a} to {b}.',
    'missingAdd': 'Count the empty spaces up to {a}.',
    'place': 'Each rod is 10 and each cube is 1.',
    'placeSum': '{a} tens and {b} ones.',
    // comparing
    'cmpWork': 'Work out each side first.',
    'cmpLine': 'The number further right on the line is bigger.',
    'cmpSame': 'Both are at the same place, so they are equal.',
    'cmpTens': 'Compare the tens first.',
    'cmpOnes': 'Same tens, so compare the ones.',
    // rows and patterns
    'step': 'Every jump is {a}.',
    'grow': 'Each jump is 1 bigger than the last.',
    'nextJump': 'So the next jump is {a}.',
    'repeat': 'This part repeats again and again.',
    'repeatNext': 'Keep repeating to find the next one.',
    // true or false, find all, pairs
    'workOut': 'Work it out.',
    'tfYes': 'Both sides are the same, so it is right.',
    'tfNo': 'The sides are different, so it is wrong.',
    'checkEach': 'Work out every card. Only the ones that make {a} count.',
    'pairsFind': 'Look for two cards that make {a}.',
    // times
    'rows': '{a} rows of {b}.',
    'skip': 'Count on by {a} for each row.',
    'split5': 'Cut it into 5 rows and {a} more.',
    'times10': 'Times 10 puts a 0 on the end.',
    'times9': '9 rows is 10 rows take away one row.',
    'times1': 'One row of {a} is just {a}.',
    'mulMiss': 'Jump by {a} until you reach {b}. Count the jumps.',
    // puzzles
    'trySigns': 'Try each sign and see which one works.',
    'leftToRight': 'Work from left to right.',
    'pyrRule': 'Each brick is the two bricks under it added together.',
    'pyrDown': 'Going down: the top brick take away the one you know.',
    'balLeft': 'Work out the side you know.',
    'balRight': 'The other side must be the same.',
    'sameValue': 'Work out the value. Find the card with the same value.',
    // shapes
    'corners': 'Count the corners one by one.',
    'sidesTarget': 'The top shape has {a} sides.',
    'sidesMatch': 'Count the sides of each shape. Tap the ones with {a}.',
    'mirror': 'Fold along the line. Each square lands just as far away on the other side.',
    'mirrorWrong': 'A plain copy or an upside-down picture does not fold onto it.',
    'sphere': 'Round like a ball: a sphere.',
    'cube': 'A box with square faces: a cube.',
    'cylinder': 'Round and flat on both ends, like a can: a cylinder.',
    'cone': 'Round at the bottom with a point on top: a cone.',
    'triSize': 'Triangles made of {a} small parts.',
    'triSmall': 'Count the small triangles first.',
    'triTotal': 'Add up all the sizes.',
    'sqxSmall': 'The two lines make 4 small triangles.',
    'sqxBig': 'Each half of the square is a big triangle: 4 more.',
    // measuring and money
    'ruler': 'The snake starts at {a} and ends at {b}.',
    'rulerDiff': 'Its length is the jump from {a} to {b}.',
    'clips': 'Count the paper clips along the snake.',
    'guess': 'Lay the small square along the snake again and again.',
    'coinsSort': 'Start with the biggest coins and keep a running total.',
    'payCheck': 'Add up each handful. Only one is exactly {a}.',
    'fewest': 'Take the biggest coin that fits, again and again.',
    'change': 'Count up from the price to what you paid.',
    // stories
    'storyStart': 'At the start there are {a}.',
    'storyAway': '{a} go away.',
    'storyMore': '{a} more come.',
    'storyEnd': 'Now there are {a}.',
    'storyMissing': 'Start and end are known. The difference went away.',
    // what went wrong
    'oopsNewTen': 'The new ten was left out.',
    'oopsExtraTen': 'One ten too many.',
    'oopsBorrow': 'The small ones were taken from the big ones. First break a ten.',
    'oopsTookAway': 'That is taking away. Here we add.',
    'oopsAdded': 'That is adding. Here we take away.',
    'oopsOne': 'Just one off. Count again carefully.',
    'oopsSwap': 'The tens and ones got swapped. Rods are tens, cubes are ones.',
    'oopsHave': 'That is the number you already have.',
    'oopsSym': 'The open side of the sign always faces the bigger number.',
    'oopsRow': 'One row too many or too few.',
    'oopsPlus': 'That is adding the numbers. Times means rows of the same size.',
    'oopsStep': 'Check the jump size between the numbers.',
    'oopsWhole': 'That is the whole side. The ? is only part of it.',
    'oopsRuler': 'The snake does not start at 0. Count from where it starts.',
    'oopsStory': 'Look again: did they go away, or did more come?',
  },
};

let lang = 'en';
export const setLang = l => { if (WORDS[l]) lang = l; };

export function say(key, vars = {}) {
  const t = WORDS[lang][key] ?? WORDS.en[key] ?? '';
  return t.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}
