import {ticTacToe, vanishingTicTacToe} from "./ticTacToe.js";

export const GAMES = Object.fromEntries(
    [ticTacToe, vanishingTicTacToe].map((game) => [game.id, game])
);
