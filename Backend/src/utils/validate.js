export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
export const ROOM_CODE_PATTERN = /^[a-zA-Z0-9-]{3,40}$/;

export const normalizeUsername = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";

export const isValidUsername = (value) => USERNAME_PATTERN.test(value);

export const isValidName = (value) => typeof value === "string" && value.trim().length >= 1 && value.trim().length <= 60;

// bcrypt only uses the first 72 bytes, so longer passwords would be silently truncated.
export const isValidPassword = (value) => typeof value === "string" && value.length >= 8 && Buffer.byteLength(value) <= 72;

export const isValidRoomCode = (value) => typeof value === "string" && ROOM_CODE_PATTERN.test(value);
