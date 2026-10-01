import {test} from "node:test";
import assert from "node:assert/strict";
import {isValidPassword, isValidRoomCode, isValidUsername, normalizeUsername} from "../src/utils/validate.js";
import {readBearerToken} from "../src/middleware/auth.js";
import {hashToken} from "../src/utils/tokens.js";

test("usernames are trimmed and lower-cased before checking", () => {
    assert.equal(normalizeUsername("  Alex.Morgan "), "alex.morgan");
    assert.equal(normalizeUsername(42), "");
    assert.ok(isValidUsername("alex.morgan"));
    assert.ok(!isValidUsername("al"));
    assert.ok(!isValidUsername("alex morgan"));
});

test("passwords must fit bcrypt's 72-byte limit", () => {
    assert.ok(isValidPassword("correct horse"));
    assert.ok(!isValidPassword("short"));
    assert.ok(!isValidPassword("é".repeat(40)));
});

test("room codes reject spaces, slashes and very long values", () => {
    assert.ok(isValidRoomCode("team-standup"));
    assert.ok(!isValidRoomCode("a/b"));
    assert.ok(!isValidRoomCode("x".repeat(41)));
    assert.ok(!isValidRoomCode({}));
});

test("only well-formed bearer tokens are read", () => {
    const token = "a".repeat(64);
    assert.equal(readBearerToken(`Bearer ${token}`), token);
    assert.equal(readBearerToken("Bearer nope"), null);
    assert.equal(readBearerToken(undefined), null);
});

test("token hashes are stable and don't contain the token", () => {
    const token = "b".repeat(64);
    assert.equal(hashToken(token), hashToken(token));
    assert.ok(!hashToken(token).includes(token));
});
