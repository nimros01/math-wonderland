// Every solver in one table, keyed by q.sol.t. Each world's file adds its own kinds.
import { SOLVERS as BASIC } from './sol-basic.js';
import { OCEAN_SOLVERS } from './sol-ocean.js';
import { CANDY_SOLVERS } from './sol-candy.js';
import { DESERT_SOLVERS } from './sol-desert.js';
import { VOLCANO_SOLVERS } from './sol-volcano.js';
import { SPACE_SOLVERS } from './sol-space.js';

export const SOLVERS = { ...BASIC, ...OCEAN_SOLVERS, ...CANDY_SOLVERS, ...DESERT_SOLVERS, ...VOLCANO_SOLVERS, ...SPACE_SOLVERS };
