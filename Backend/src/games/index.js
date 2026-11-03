import {bingo} from "./bingo.js";
import {dotsAndBoxes} from "./dotsAndBoxes.js";
import {ticTacToe, vanishingTicTacToe} from "./ticTacToe.js";
import {wordSearch} from "./wordSearch.js";

export const GAMES = Object.fromEntries(
    [bingo, ticTacToe, vanishingTicTacToe, dotsAndBoxes, wordSearch].map((game) => [game.id, game])
);
