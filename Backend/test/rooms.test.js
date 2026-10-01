import {test} from "node:test";
import assert from "node:assert/strict";
import {createRoomRegistry} from "../src/controllers/rooms.js";

test("a new member receives the people already in the room", () => {
    const rooms = createRoomRegistry();
    rooms.join("abc-123", {id: "a", name: "Asha"});
    const result = rooms.join("abc-123", {id: "b", name: "Ben"});

    assert.equal(result.ok, true);
    assert.deepEqual(result.peers, [{id: "a", name: "Asha"}]);
    assert.ok(rooms.sameRoom("a", "b"));
});

test("rooms refuse members past the cap", () => {
    const rooms = createRoomRegistry({maxParticipants: 2});
    rooms.join("r1", {id: "a", name: "A"});
    rooms.join("r1", {id: "b", name: "B"});

    assert.equal(rooms.join("r1", {id: "c", name: "C"}).ok, false);
});

test("joining another room leaves the previous one", () => {
    const rooms = createRoomRegistry();
    rooms.join("r1", {id: "a", name: "A"});
    rooms.join("r2", {id: "a", name: "A"});

    assert.equal(rooms.roomOf("a"), "r2");
    assert.deepEqual(rooms.peersOf("r1"), []);
});

test("the last person leaving removes the room and its chat", () => {
    const rooms = createRoomRegistry();
    rooms.join("r1", {id: "a", name: "A"});
    rooms.addMessage("r1", {text: "hi"});

    assert.deepEqual(rooms.leave("a"), {roomCode: "r1", empty: true});
    assert.deepEqual(rooms.join("r1", {id: "b", name: "B"}).messages, []);
});

test("chat history keeps only the newest messages", () => {
    const rooms = createRoomRegistry({maxMessages: 2});
    rooms.join("r1", {id: "a", name: "A"});
    for(const text of ["1", "2", "3"]) rooms.addMessage("r1", {text});

    assert.deepEqual(rooms.join("r1", {id: "b", name: "B"}).messages.map((m) => m.text), ["2", "3"]);
});

test("people in different rooms can't signal each other", () => {
    const rooms = createRoomRegistry();
    rooms.join("r1", {id: "a", name: "A"});
    rooms.join("r2", {id: "b", name: "B"});

    assert.equal(rooms.sameRoom("a", "b"), false);
    assert.equal(rooms.sameRoom("a", "nobody"), false);
});
