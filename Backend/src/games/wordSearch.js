import {baseState, finish, isInt, publicState, removePlayer, seatOf, shuffle, topScorers} from "./turns.js";

// Everyone searches the same grid at once. The first person to mark a word claims it.
export const GRID_SIZE = 12;
const WORDS_PER_GAME = 8;
const PLACEMENT_TRIES = 300;
const LETTERS = "ABCDEFGHIJKLMNOPRSTUWY";

export const THEMES = {
    Animals: ["ELEPHANT", "GIRAFFE", "TIGER", "MONKEY", "ZEBRA", "PANDA", "RABBIT", "DOLPHIN", "PARROT", "TURTLE", "LION", "CAMEL", "KANGAROO", "PENGUIN", "SQUIRREL"],
    Fruits: ["MANGO", "BANANA", "APPLE", "ORANGE", "GRAPES", "PAPAYA", "GUAVA", "CHERRY", "LEMON", "PEACH", "LYCHEE", "COCONUT", "PINEAPPLE", "MELON", "PLUM"],
    Space: ["PLANET", "COMET", "GALAXY", "ORBIT", "ROCKET", "METEOR", "SATURN", "JUPITER", "NEBULA", "ECLIPSE", "STAR", "MOON", "ASTEROID", "MARS", "VENUS"],
    Sports: ["CRICKET", "FOOTBALL", "TENNIS", "HOCKEY", "KABADDI", "CHESS", "BOXING", "SWIMMING", "GOLF", "RUGBY", "CYCLING", "ARCHERY", "BADMINTON", "KARATE", "ROWING"],
    Kitchen: ["SPOON", "KETTLE", "PLATE", "BOWL", "KNIFE", "OVEN", "TOASTER", "SPATULA", "BLENDER", "LADLE", "FORK", "SAUCEPAN", "GRATER", "TONGS", "CUP"],
    Weather: ["RAIN", "THUNDER", "CLOUD", "STORM", "SUNSHINE", "WIND", "SNOW", "RAINBOW", "MONSOON", "FOG", "BREEZE", "HAIL", "LIGHTNING", "FROST", "DRIZZLE"]
};

const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];

const fits = (grid, word, r, c, dr, dc) => {
    for(let i = 0; i < word.length; i += 1) {
        const rr = r + dr * i;
        const cc = c + dc * i;
        if(rr < 0 || cc < 0 || rr >= GRID_SIZE || cc >= GRID_SIZE) return false;
        const existing = grid[rr][cc];
        if(existing !== null && existing !== word[i]) return false;
    }
    return true;
};

export const buildPuzzle = (words, random = Math.random) => {
    const grid = Array.from({length: GRID_SIZE}, () => Array(GRID_SIZE).fill(null));
    const placed = [];
    // Long words first, while there is still plenty of room for them.
    for(const word of [...words].sort((a, b) => b.length - a.length)) {
        for(let attempt = 0; attempt < PLACEMENT_TRIES; attempt += 1) {
            const [dr, dc] = DIRECTIONS[Math.floor(random() * DIRECTIONS.length)];
            const r = Math.floor(random() * GRID_SIZE);
            const c = Math.floor(random() * GRID_SIZE);
            if(!fits(grid, word, r, c, dr, dc)) continue;
            const cells = [];
            for(let i = 0; i < word.length; i += 1) {
                grid[r + dr * i][c + dc * i] = word[i];
                cells.push([r + dr * i, c + dc * i]);
            }
            placed.push({word, cells});
            break;
        }
    }
    for(const row of grid) {
        for(let c = 0; c < GRID_SIZE; c += 1) row[c] ??= LETTERS[Math.floor(random() * LETTERS.length)];
    }
    return {grid: grid.map((row) => row.join("")), placed};
};

const sameCell = (a, b) => a[0] === b[0] && a[1] === b[1];
const isCell = (cell) => Array.isArray(cell) && isInt(cell[0], 0, GRID_SIZE - 1) && isInt(cell[1], 0, GRID_SIZE - 1);

export const wordSearch = {
    id: "word-search",
    name: "Word Search",
    minPlayers: 1,
    maxPlayers: 6,

    normalizeOptions(options) {
        return {theme: Object.hasOwn(THEMES, options?.theme) ? options.theme : "Random"};
    },

    create(participants, options, random = Math.random) {
        const chosen = this.normalizeOptions(options).theme;
        const theme = chosen === "Random" ? shuffle(Object.keys(THEMES), random)[0] : chosen;
        const candidates = shuffle(THEMES[theme], random).slice(0, WORDS_PER_GAME);
        const {grid, placed} = buildPuzzle(candidates, random);
        return {
            ...baseState(participants),
            theme,
            grid,
            words: placed.map(({word, cells}) => ({word, cells, foundBy: null}))
        };
    },

    move(state, playerId, move) {
        if(state.finished) return {ok: false, error: "The game is over."};
        if(seatOf(state, playerId) === -1) return {ok: false, error: "You are watching this game."};
        const {from, to} = move || {};
        if(!isCell(from) || !isCell(to)) return {ok: false, error: "Drag from the first letter to the last."};

        const target = state.words.find(({cells}) => {
            const first = cells[0];
            const last = cells[cells.length - 1];
            return (sameCell(first, from) && sameCell(last, to)) || (sameCell(first, to) && sameCell(last, from));
        });
        if(!target) return {ok: false, error: "That isn't one of the words.", miss: true};
        if(target.foundBy) return {ok: false, error: "Someone already found that one.", miss: true};

        target.foundBy = playerId;
        state.players[seatOf(state, playerId)].score += 1;
        if(state.words.every((word) => word.foundBy)) {
            const winners = topScorers(state);
            finish(state, winners, winners.length > 1 ? "Tied on words." : "All words found.");
        }
        return {ok: true, found: target.word};
    },

    view(state) {
        const {current: _current, ...base} = publicState(state);
        return {
            ...base,
            current: null,
            theme: state.theme,
            grid: state.grid,
            // Positions stay secret until a word is found, or the game ends.
            words: state.words.map(({word, cells, foundBy}) => ({word, foundBy, cells: foundBy || state.finished ? cells : null}))
        };
    },

    removePlayer(state, playerId) {
        removePlayer(state, playerId, 1);
    }
};
