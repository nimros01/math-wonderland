// The ⓘ button: a short English explanation of what a question asks, for parents and kids who read.
// It works out the kind of question from its stage and its shape, so the question generators stay as they are.
import { WORLDS } from './worlds.js';

const has = (s, t) => String(s || '').includes(t);
const frac1Of = '<b>1</b><b>?</b>';
const plain = s => String(s || '').replace(/<[^>]*>/g, ' ');
const isCmp = q => q.input === 'choice' && ['<', '=', '>'].includes(String(q.answer)) && q.choices?.length === 3;
const isSign = q => q.input === 'choice' && has(q.eq, '◯') && !isCmp(q);
const isRow = q => !q.eq && has(q.visual, 'class="seq"');

const CMP = 'Compare the two sides. Pick < if the left side is smaller, > if it is bigger, or = if they are the same.';
const SIGN = 'Which sign goes in the empty circle to make the equation true?';
const MISSING = 'Find the number that goes in the yellow ? box so the equation is true.';
const TF = 'Is this equation right? Tap ✓ if it is true and ✗ if it is wrong.';
const SAME = 'Tap every card that equals the number at the top.';
const PYRAMID = 'Number pyramid: each brick is the sum of the two bricks right under it. Which number goes in the yellow ? brick?';
const MACHINE = 'Number machine: a number goes in on the left, is changed by each box in turn, and comes out on the right. Which number went in?';
const SQUARES = 'How many squares can you find in all? Count the small ones and the bigger ones made of small squares.';
const FENCE = 'The crab walks once all around the edge of the shape. How many square sides long is its walk (the perimeter)?';
const STORY = 'Read the picture story from left to right. How many are there in the last picture?';
const STORY_EXPR = 'Read the picture story from left to right. Which calculation tells the story?';

// Help for each stage. Return null to fall back to the general help below.
const BY_STAGE = {
  count: q => (has(q.visual, 'frames') && isCmp(q) ? 'Which ten-frame has more dots? ' + CMP
    : q.eq === '?' ? 'Count the dots. How many are there?'
    : isRow(q) ? 'The numbers go up or down by the same step each time. Which number goes in the yellow ? box?' : null),
  pattern: q => (isRow(q) && q.choices?.every(c => isNaN(c.value))
    ? 'The pictures repeat in a pattern. Which picture comes next?'
    : isRow(q) ? 'The numbers follow a rule, like adding the same number each time. Which number comes next?' : null),
  make10: q => (/\+ \? = 10|^\? \+/.test(q.eq) ? 'Which number goes with the other one to make 10?' : null),
  tens: q => (q.eq === '?' ? 'Each long rod is 10 and each small cube is 1. What number do the blocks show?' : null),
  shapes: q => (q.input === 'multi' ? 'Tap every shape with the same number of sides as the white shape at the top.'
    : 'How many corners does this shape have?'),
  mirror: q => (has(q.visual, 'mirror') ? 'Fold the picture along the dashed line. Which half is its mirror image, to finish the picture?'
    : has(q.eq, '= ?') ? 'Which 3D shape looks like this thing? A ball is a sphere, a box a cube, a can a cylinder, an ice-cream cone a cone.'
    : 'How many triangles can you find? Count the big ones made of smaller triangles too.'),
  puzzle1: q => puzzle(q),
  puzzle2: q => puzzle(q),

  // Meadow stages added after launch
  measure: q => (has(q.eq, '📎') ? 'How many paper clips long is the snake?'
    : isCmp(q) ? 'Which snake is longer, red or blue? Pick > if red is longer, < if blue is longer, = if they are the same.'
    : has(q.eq, '−') ? 'How much longer is the red snake than the blue one? Use the ruler.'
    : has(q.eq, '≈') ? 'Guess the length: the small yellow square is 1 long. About how many squares long is the snake?'
    : 'How long is the snake? Read the ruler. Careful, the snake does not always start at 0.'),
  shop: q => (q.fewest ? 'Every handful pays exactly the price on the tag. Which one uses the fewest coins?'
    : has(q.eq, '🪙') ? 'What is the smallest number of coins that pays exactly this price?'
    : has(q.eq, '−') ? 'You pay with the first amount for the toy. How much change do you get back?'
    : q.eq ? 'Add up the coins. How much money is there?'
    : 'Which handful of coins pays exactly the price on the tag?'),
  story1: q => (has(q.visual, '<span class="slot">?</span><b class="fly">')
    ? 'Read the picture story from left to right. How many flew away in the middle picture?'
    : q.input === 'choice' && q.choices?.some(c => has(c.html, 'class="ex"')) ? STORY_EXPR : STORY),

  // Ocean
  'o-1000': q => (q.eq === '?' ? 'Each big square is 100, each rod is 10 and each small cube is 1. What number do the blocks show?'
    : has(q.eq, '≈') ? 'Round the number: which of the round numbers (tens or hundreds) is it closest to?' : null),
  'o-10k': q => (q.eq === '?' ? 'Add up all the coins. What is their total?'
    : has(q.eq, '→') ? DIGIT : null),
  'o-million': q => (has(q.visual, 'zoom') ? 'Each step is 10 times bigger than the one before. Which number is missing?'
    : has(q.eq, '→') ? DIGIT
    : has(q.eq, '×') || has(q.eq, '÷') ? 'Multiply or divide by 10, 100 or 1000. Tip: × 10 adds a zero, ÷ 10 takes one away.' : null),
  'o-add': q => (has(q.eq, '≈') ? 'Don\'t work it out exactly. Which hundred is the answer closest to?' : null),
  'o-share': () => '÷ means sharing equally: every net gets the same number of fish. ' + MISSING,
  'o-divx': q => (q.eq === '?' ? 'Fact triangle: the top number is the two bottom numbers multiplied together. Which number is missing?'
    : has(q.eq, '<br>') ? '× and ÷ are partners. Use the first fact to solve the second.'
    : has(q.eq, '🐟') ? REM : null),
  'o-longdiv': q => (has(q.eq, '🐟') ? REM
    : /\d\?|\?\d/.test(plain(q.eq)) ? 'One digit of the answer is hidden. Which digit goes in the yellow box?' : null),
  'o-frac': q => (q.input === 'multi' ? 'Tap every fraction that is the same as one half.'
    : q.eq === '?' ? 'What part is coloured? The bottom number is how many equal pieces there are, the top number how many are coloured.'
    : isCmp(q) ? 'Which fraction is bigger? ' + CMP
    : has(q.eq, '×') ? '½ × 100 means half of 100. Work out that part of the number.' : null),
  'o-clock': q => (q.eq === '?' ? 'What time does the clock show? The short hand shows the hour, the long hand the minutes.'
    : q.eq.startsWith('+') ? 'What time will the clock show after these many minutes?'
    : 'Which clock shows this time?'),
  'o-angle': q => (q.input === 'multi' ? 'Tap every right angle: a square corner of 90°, like the one at the top.'
    : isCmp(q) ? 'Which angle is opened wider, red or blue? The length of the lines does not matter. Pick > if red is wider, < if blue is wider.'
    : has(q.eq, '180') ? 'A straight line is 180°. How many degrees is the other part?'
    : 'How many degrees is this angle? Compare it with a square corner and with a straight line.'),
  'o-area': q => (has(q.eq, '🟦') ? 'Area: how many squares cover the blue shape?'
    : has(q.eq, '🦀') ? FENCE
    : 'Which rectangle has this area (is made of this many squares)?'),
  'o-sort': q => {
    if (q.input === 'multi') {
      if (has(q.target, 'rails')) return 'Tap every shape with parallel sides: two sides that run the same way, like train rails, and never meet.';
      if (has(q.target, 'polygon')) return 'Tap every shape whose sides are all the same length.';
      return 'Tap every shape that has a right angle (a square corner).';
    }
    if (has(q.eq, 'rails')) return 'How many pairs of parallel sides does the shape have? Parallel sides run the same way, like train rails.';
    if (q.layout === 'grid') return 'Three shapes belong together. Tap the odd one out. Tip: look for parallel sides.';
    return 'How many sides does this shape have?';
  },
  'o-turn': q => (has(q.eq, '🧊') ? 'Which flat pattern can be folded into a cube?'
    : 'Which shape is the same as the blue one, just turned around? Flipped (mirror) shapes do not count.'),
  'o-likely': q => (has(q.eq, '✋ = ?') ? 'You pull one marble out of the bag without looking. Which colour are you most likely to get?'
    : q.layout === 'pair' ? 'In which bag are you more likely to pull out a red marble? Compare the reds with all the marbles, not only the number of reds.'
    : 'What fraction of the marbles in the bag have this colour?'),
  'o-spin': q => (has(q.eq, '🎲') ? 'A die was rolled 60 times and the chart shows how often each number came up. Which number is the die cheating on?'
    : has(q.eq, '⬆') ? 'Which one has the tallest bar in the chart?'
    : has(q.eq, '−') ? 'Read the chart: how many more does the first one have than the second?'
    : has(q.eq, '= ?') ? 'Read the chart: how many does this one have?'
    : 'Which colour will the spinner land on most often? Look for the colour that covers the most.'),
  'o-story': q => (q.choices?.some(c => has(c.html, 'class="ex"')) ? STORY_EXPR : STORY),
  'o-puz1': q => opuzzle(q),
  'o-puz2': q => opuzzle(q),

  // Candy Factory
  'c-rect': q => (q.boxes ? 'Which box holds exactly this many candies? Count the rows and the candies in each row.'
    : q.shapes ? 'How many different rectangle boxes can hold all these candies, with no gaps and none left over? A box turned on its side counts as the same box, and one long row counts too.'
    : q.prime ? 'Tap every number of candies that can only be packed in one long row, never in a box with 2 or more rows. These are the prime numbers.'
    : q.input === 'multi' ? 'Tap every box size (rows × candies in a row) that holds exactly this many candies.'
    : 'The candies fill a box in equal rows. How many candies are in each row?'),
  'c-divis': q => (q.input === 'multi' ? `The machine only takes numbers that divide by ${q.divisor} with nothing left over. Tap every number it takes.`
    : q.digit9 ? 'A number divides by 9 when its digits add up to 9, 18 or 27. Which hidden digit lets the number into the ÷9 machine?'
    : 'Only one of these machines takes this number: the one it divides by exactly, with nothing left over. Which one?'),
  'c-equiv': q => (q.equiv ? 'Tap every fraction that is the same amount as the fraction at the top. Cutting every piece into equal smaller pieces keeps the amount the same.'
    : isCmp(q) ? 'Which fraction is more chocolate? ' + CMP
    : 'Both fractions are the same amount of chocolate, cut into different pieces. Which number goes in the yellow ? box?'),
  'c-mixed': q => (isCmp(q) ? 'Compare the fraction with the whole number of cakes. ' + CMP
    : !has(plain(q.eq), '=') ? 'Each cake is cut into equal slices. The bottom number is the slices in one cake. How many pink slices are there in all?'
    : has(q.eq, 'mixn') ? 'Whole cakes and slices: the big number counts whole cakes, the fraction counts the extra slices. Which number goes in the yellow ? box?'
    : 'How many whole cakes do these slices make?'),
  'c-addf': q => (q.tf ? 'Is the robot right? To add slices of the same size, add the tops and keep the size (the bottom number) the same.'
    : 'Add or take away the slices. If the slices are different sizes, first cut both into the size shown in the answer. How many of those slices are there?'),
  'c-of': q => (has(q.eq, frac1Of) ? 'Fold the tray one way, then the other. What fraction of the whole tray is the part that is in both folds?'
    : q.visual && has(q.visual, 'cgroup') ? 'Share the candies into equal groups, one group for each part of the bottom number. The top number says how many groups you take. How many candies is that?'
    : 'A fraction of a fraction: fold the tray one way for the first fraction and the other way for the second. How many small squares are in both folds?'),
  'c-scoop': q => (/^\?/.test(plain(q.eq).trim()) ? 'How many cups of flour make this many scoops of that size?'
    : 'How many scoops of this size fill the amount on the left?'),
  'c-dec': q => (isCmp(q) ? 'Compare the two decimals. Tip: one tenth is the same as ten hundredths, so turn both into hundredths before you compare. ' + CMP
    : has(q.eq, 'frac') ? 'Write the decimal as a fraction: tenths or hundredths. Which number goes in the yellow ? box?'
    : has(q.visual, '<line') ? 'Each small step on the number line is one tenth. Which number does the red arrow point to?'
    : 'The chocolate has 100 squares. Each row is one tenth (0.1) and each square is one hundredth (0.01). What decimal is the dark part?'),
  'c-reg': q => (has(q.eq, '× 10') || has(q.eq, '÷ 10') ? 'Multiplying by 10 moves every digit one place to the left (by 100, two places); dividing by 10 moves them one place to the right. What is the answer?'
    : has(q.eq, '×') ? 'Multiply the decimal by the whole number. Tip: 0.4 × 12 is 4 tenths, twelve times.'
    : 'Add or subtract the prices. Line up the decimal points first.'),
  'c-pct': q => (q.sale ? 'The price is on the tag and the red sticker says how many percent is taken off. How much do you pay?'
    : has(q.eq, '%') ? 'Percent means "out of 100": 10% of 1,000 is 10 out of every 100, so 100. How much is it?'
    : 'How many percent of the picture is full? The whole thing is 100%.'),
  'c-ratio': q => (q.rate ? 'Every candy costs the same. The picture shows what some candies cost. How many coins do the candies at the top cost?'
    : q.input === 'choice' && q.layout === 'grid' ? 'Which drink tastes exactly the same? It must have the same number of strawberries for every lemon.'
    : 'The drink must taste the same, so both fruits grow by the same times. Which number goes in the yellow ? box?'),
  'c-puz': q => (q.share ? 'Share the cakes equally among the children. How much cake does each child get?'
    : q.eatLeft ? 'The candies go through the boxes one after the other, and each box keeps only that fraction of what it gets. How many candies come out at the end?'
    : has(q.eq, '= 1') ? 'The fractions must add up to exactly one whole. Which number goes under the 1 in the last fraction?'
    : 'Split the fraction into two fractions with 1 on top. Which number goes in the yellow ? box?'),

  // Pyramid Desert
  'd-units': q => (isCmp(q) ? 'Turn both amounts into the same small unit, then compare. ' + CMP
    : 'Change the amount into the other unit. 1 m = 100 cm, 1 cm = 10 mm, 1 km = 1,000 m, 1 kg = 1,000 g, 1 l = 1,000 ml. Which number goes in the yellow ? box?'),
  'd-protr': q => (q.guess ? 'Guess the size of the angle without measuring. Which of these is it closest to? A square corner is 90°.'
    : 'Read the protractor: one red arm lies on 0, so read the number where the other red arm crosses the scale. How many degrees is the angle?'),
  'd-tri': q => (q.line ? 'Together the two angles make a straight line, and a straight line is 180°. How big is the angle with the ?'
    : q.iso ? 'The corners marked = are equal, and the three corners of every triangle add up to 180°. How big is the angle with the ?'
    : 'The three corners of every triangle add up to 180°. How big is the corner with the ?'),
  'd-area': q => (q.shape === 'side' ? 'The area of this slanted rectangle is base × the red height. The area is given; how long is the base?'
    : q.shape === 'tri' ? 'A triangle is half of a slanted rectangle: base × red height, then halve it. How many squares is its area?'
    : 'Cut the slanted corner off and slide it to the other side: it becomes a rectangle. Area = base × the red height (not the slanted side). How many squares?'),
  'd-trap': () => 'Flip a copy of this shape and put it next to it: together they make a slanted rectangle. So the area is (top + bottom) × red height, halved. How many squares?',
  'd-circle': q => (q.pi3 ? 'Roll the wheel once. The distance it goes is just over how many times its width?'
    : q.carea ? 'The area of a circle is about 3.14 × red radius × red radius. Which is closest?'
    : q.back ? 'The wheel rolled this far in one turn, which is about 3.14 × its width. How wide is it?'
    : 'In one turn a wheel goes about 3.14 × its width (the red line). About how far does it go?'),
  'd-vol': q => (q.surface ? 'Paint the whole outside of the box: count the squares on all six faces. How many squares get painted?'
    : has(q.eq, '×') ? 'The volume of a box is length × width × height. Which number goes in the yellow ? box?'
    : 'How many small cubes are in the whole box, including the ones you cannot see? Tip: count one layer, then times the number of layers.'),
  'd-map': q => (q.find ? 'The first number says how far to go right, the second how far to go up. Which thing is at that spot?'
    : q.move ? 'Start at the camel and walk the arrows: right, then up. Where do you end? Write it as (right, up).'
    : q.rect ? 'The palm trees are three corners of a rectangle. Where is the fourth corner, where the treasure is? Write it as (right, up).'
    : 'Where is it on the map? Write the spot as (how far right, how far up).'),
  'd-mean': q => (q.missing ? 'The mean (the level height) is given. Which number is hidden? Tip: all the numbers together must be the mean × how many there are.'
    : q.nums ? 'Find the mean: if every card were the same, what would it be? Add all the numbers and share the total equally among the cards.'
    : 'Move blocks from the tall towers to the short ones until all the towers are the same height. How tall is each tower then?'),
  'd-median': q => (q.mode ? 'Each dot is one camel at that number. Which number has the most dots?'
    : q.even ? 'Put the numbers in order. There are two in the middle: the median is exactly halfway between them.'
    : 'Line them up from smallest to biggest. Which number is in the middle (the median)?'),
  'd-fence': q => (q.most ? 'All these pens use the same length of fence. Which pen gives the camels the most room inside?'
    : q.lshape ? 'How long is the fence all the way around the shape? Count the sides of the squares on the edge.'
    : q.square ? 'A square pen uses this much fence, the same on all four sides. How many squares of room are inside?'
    : 'Both pens hold the same number of squares. Which one needs more fence around it? ' + CMP),
  'd-story': q => (q.time ? 'The camel walks the same distance every hour. How many hours does the long trip take?'
    : q.price ? 'Every coconut costs the same. How much do the coconuts in the second picture cost?'
    : q.meet ? 'The two camels walk toward each other, each at its own speed per hour. After how many hours do they meet?'
    : 'The camel walks the same distance every hour. How far does it get?'),
};

const DIGIT = 'How much is the red underlined digit worth? It depends on its place: a digit in the tens place is worth that digit times 10, in the hundreds place times 100, and so on.';
const REM = '🐟 is the remainder: what is left over after sharing equally. For example, 65 ÷ 12 = 5 🐟 5. Find the number in the yellow box.';

function puzzle(q) {
  if (has(q.visual, 'class="pyr"')) return PYRAMID;
  if (/[+×].*=.*[+×] \?/.test(q.eq)) return 'Both sides must be equal. Which number makes the right side the same as the left side?';
  if (q.input === 'choice' && q.small) return 'Which card has the same value as the calculation at the top?';
  if (has(q.eq, '◯ ') && (q.eq.match(/◯/g) || []).length === 2) return 'Which two signs go in the empty circles to make the equation true?';
  return null;
}

function opuzzle(q) {
  if (has(q.eq, 'mach')) return MACHINE;
  if (has(q.eq, '□')) return SQUARES;
  if (has(q.eq, '🦀')) return FENCE;
  if (/\d\?|\?\d/.test(plain(q.eq))) return 'One digit is hidden. Which digit makes the calculation right?';
  if (has(q.eq, 'frac')) return 'Work from the right: ½ × ¼ × 80 means half of a quarter of 80.';
  return null;
}

// What to tap or type, added after the task.
function howTo(q) {
  if (q.input === 'pad') return 'Type the answer on the number keys and press ✔.';
  if (q.input === 'multi') return 'The small boxes at the top show how many there are to find.';
  if (q.input === 'pairs') return '';
  return q.tf || isCmp(q) ? '' : 'Tap the right answer.';
}

function general(q) {
  if (q.tf) return TF;
  if (q.input === 'multi') return SAME;
  if (q.input === 'pairs') return `Tap two cards that make ${q.target} when you ${q.op === '×' ? 'multiply' : 'add'} them. Find ${q.need} pairs like that.`;
  if (isCmp(q)) return CMP;
  if (isSign(q)) return SIGN;
  if (isRow(q)) return 'Find the rule of the row. Which number goes in the yellow ? box?';
  if (has(q.visual, 'class="pyr"')) return PYRAMID;
  if (has(q.eq, '?')) return MISSING;
  return 'Look at the picture and find the answer.';
}

let byGen = null;
function stageIdOf(gen) {
  if (!byGen) {
    byGen = new Map();
    WORLDS.forEach(w => w.stages.forEach(s => byGen.set(s.gen, s.id)));
  }
  return byGen.get(gen);
}

// stageId is optional: without it the stage is found from the question's generator (boss and placement rounds).
export function helpFor(q, stageId = stageIdOf(q.gen)) {
  let task = q.tf && !has(q.eq, '🤖') ? TF : null;
  if (!task) try { task = BY_STAGE[stageId]?.(q); } catch { task = null; }
  task ||= general(q);
  const how = howTo(q);
  return how ? `${task} ${how}` : task;
}
