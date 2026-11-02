import {bingo} from "./bingo.js";
import {dotsAndBoxes} from "./dotsAndBoxes.js";
import {ticTacToe, vanishingTicTacToe} from "./ticTacToe.js";

export const GAMES = Object.fromEntries(
    [bingo, ticTacToe, vanishingTicTacToe, dotsAndBoxes].map((game) => [game.id, game])
);
