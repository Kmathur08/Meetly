import {bingo} from "./bingo.js";
import {dotsAndBoxes} from "./dotsAndBoxes.js";
import {fenceRace} from "./fenceRace.js";
import {ticTacToe, vanishingTicTacToe} from "./ticTacToe.js";
import {wordSearch} from "./wordSearch.js";

export const GAMES = Object.fromEntries(
    [bingo, ticTacToe, vanishingTicTacToe, dotsAndBoxes, fenceRace, wordSearch].map((game) => [game.id, game])
);
