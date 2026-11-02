import {bingo} from "./bingo.js";
import {ticTacToe, vanishingTicTacToe} from "./ticTacToe.js";

export const GAMES = Object.fromEntries(
    [bingo, ticTacToe, vanishingTicTacToe].map((game) => [game.id, game])
);
