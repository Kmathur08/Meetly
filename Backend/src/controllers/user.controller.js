import httpStatus from "http-status";
import bcrypt from "bcrypt";
import {User} from "../models/users.models.js";
import config, {iceServers} from "../config/env.js";
import {Meeting} from "../models/meeting.model.js";
import {Session} from "../models/session.model.js";
import {createToken, hashToken} from "../utils/tokens.js";
import {isValidName, isValidPassword, isValidRoomCode, isValidUsername, normalizeUsername} from "../utils/validate.js";


const login = async (req, res) => {
    const {password} = req.body;
    const username = normalizeUsername(req.body.username);

    if(!username || typeof password !== "string" || !password) return res.status(httpStatus.BAD_REQUEST).json({message: "Please provide username and password"});

    // Mongoose lower-cases the query value, and older accounts may still be stored with capitals, so match without case.
    const user = await User.findOne({username}).collation({locale: "en", strength: 2});

    if(user && await bcrypt.compare(password, user.password)) {
        const token = createToken();
        const expiresAt = new Date(Date.now() + config.sessionDays * 24 * 60 * 60 * 1000);

        await Session.create({user: user._id, tokenHash: hashToken(token), expiresAt});
        return res.status(httpStatus.OK).json({message: "Login successful", token, expiresAt});
    }

    return res.status(httpStatus.UNAUTHORIZED).json({message: "Invalid username or password"});
}

const register =  async (req, res) => {
    const {name, password} = req.body;
    const username = normalizeUsername(req.body.username);

    if(!name || !username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({message: "Name, username, and password are required"});
    }

    if(!isValidName(name)) {
        return res.status(httpStatus.BAD_REQUEST).json({message: "Name must be between 1 and 60 characters"});
    }

    if(!isValidUsername(username)) {
        return res.status(httpStatus.BAD_REQUEST).json({message: "Username must be 3-30 characters: letters, numbers, dots, dashes or underscores"});
    }

    if(!isValidPassword(password)) {
        return res.status(httpStatus.BAD_REQUEST).json({message: "Password must be 8-72 characters"});
    }

    const existingUser = await User.findOne({username}).collation({locale: "en", strength: 2});

    if(existingUser) return res.status(httpStatus.CONFLICT).json({message: "That username is already taken"});

    const hashpassword = await bcrypt.hash(password, 10);

    const newuser = new User({
        name : name.trim(),
        username : username,
        password : hashpassword
    });

    await newuser.save();
    return res.status(httpStatus.CREATED).json({message: "User registered successfully"});
}

const forgotPassword = async (req, res) => {
    // No mail provider is wired up yet, so say so plainly instead of promising an email that never arrives.
    return res.status(httpStatus.NOT_IMPLEMENTED).json({message: "Password reset isn't available yet. Please contact the Meetly team to recover your account."});
}

const logout = async (req, res) => {
    await Session.deleteOne({_id: req.session._id});
    return res.status(httpStatus.OK).json({message: "Signed out"});
};

const getProfile = async (req, res) => {
    return res.status(httpStatus.OK).json({
        user: {name: req.user.name, username: req.user.username}
    });
};

const addActivity = async (req, res) => {
    const meetingcode = typeof req.body.meetingcode === "string" ? req.body.meetingcode.trim() : "";
    if(!isValidRoomCode(meetingcode)) return res.status(httpStatus.BAD_REQUEST).json({message: "Meeting code must be 3-40 letters, numbers or dashes"});

    // Rejoining the same room after a dropped connection shouldn't fill the history with duplicates.
    const recent = await Meeting.findOne({user_id: req.user._id, meetingcode, date: {$gt: new Date(Date.now() - 30 * 60 * 1000)}});
    if(recent) return res.status(httpStatus.OK).json({meeting: recent});

    const meeting = await Meeting.create({user_id: req.user._id, meetingcode});
    return res.status(httpStatus.CREATED).json({meeting});
};

const getAllActivity = async (req, res) => {
    const meetings = await Meeting.find({user_id: {$in: [req.user._id, req.user._id.toString()]}}).sort({date: -1}).limit(50);
    return res.status(httpStatus.OK).json({meetings});
};

const getIceServers = async (req, res) => {
    return res.status(httpStatus.OK).json({iceServers: iceServers()});
};

export {getIceServers, login, register, logout, forgotPassword, getProfile, addActivity, getAllActivity};