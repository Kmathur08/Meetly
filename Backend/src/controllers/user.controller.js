import httpStatus from "http-status";
import bcrypt from "bcrypt";
import {User} from "../models/users.models.js";
import config, {iceServers} from "../config/env.js";
import {Meeting} from "../models/meeting.model.js";
import {Session} from "../models/session.model.js";
import {createToken, hashToken} from "../utils/tokens.js";
import {isValidEmail, isValidName, isValidPassword, isValidRoomCode, isValidUsername, normalizeEmail, normalizeUsername} from "../utils/validate.js";
import {mailConfigured, passwordResetEmail, sendMail} from "../utils/mailer.js";

const RESET_MINUTES = 30;
// One reset email per account per minute, so the form can't be used to flood someone's inbox.
const RESET_RESEND_MS = 60 * 1000;

const emailTaken = async (email, exceptUserId) => {
    const owner = await User.findOne({email});
    return Boolean(owner && !owner._id.equals(exceptUserId));
};


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
    const email = normalizeEmail(req.body.email);

    if(!name || !username || !password || !email) {
        return res.status(httpStatus.BAD_REQUEST).json({message: "Name, email, username, and password are required"});
    }

    if(!isValidEmail(email)) {
        return res.status(httpStatus.BAD_REQUEST).json({message: "Please enter a valid email address"});
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
    if(await emailTaken(email)) return res.status(httpStatus.CONFLICT).json({message: "That email is already used by another account"});

    const hashpassword = await bcrypt.hash(password, 10);

    const newuser = new User({
        name : name.trim(),
        username : username,
        email : email,
        password : hashpassword
    });

    await newuser.save();
    return res.status(httpStatus.CREATED).json({message: "User registered successfully"});
}

// Always gives the same answer whether or not the account exists, so the form can't be used
// to find out which usernames or emails are registered.
const RESET_SENT_MESSAGE = `If that account has an email address, a reset link is on its way. Check your inbox and spam folder; the link works for ${RESET_MINUTES} minutes.`;

const forgotPassword = async (req, res) => {
    const account = typeof req.body.account === "string" ? req.body.account.trim() : "";
    if(!account) return res.status(httpStatus.BAD_REQUEST).json({message: "Enter your username or email"});

    if(!mailConfigured() && process.env.NODE_ENV === "production") {
        console.error("Password reset requested but BREVO_API_KEY / MAIL_FROM are not set");
        return res.status(httpStatus.SERVICE_UNAVAILABLE).json({message: "Password reset emails aren't set up on the server yet. Please try again later."});
    }

    const user = account.includes("@")
        ? await User.findOne({email: normalizeEmail(account)})
        : await User.findOne({username: normalizeUsername(account)}).collation({locale: "en", strength: 2});

    const recentlySent = user?.resetSentAt && Date.now() - user.resetSentAt.getTime() < RESET_RESEND_MS;
    if(!user?.email || recentlySent) return res.status(httpStatus.OK).json({message: RESET_SENT_MESSAGE});

    const token = createToken();
    user.resetTokenHash = hashToken(token);
    user.resetExpiresAt = new Date(Date.now() + RESET_MINUTES * 60 * 1000);
    user.resetSentAt = new Date();
    await user.save();

    const link = `${config.appUrl}/#reset-password/${token}`;
    try {
        await sendMail({to: user.email, toName: user.name, ...passwordResetEmail({name: user.name, link, minutes: RESET_MINUTES})});
    } catch(error) {
        console.error("Password reset email failed:", error.message);
        // Let them try again straight away instead of waiting out the resend limit.
        user.resetSentAt = undefined;
        await user.save();
        return res.status(httpStatus.BAD_GATEWAY).json({message: "We couldn't send the email just now. Please try again in a few minutes."});
    }
    return res.status(httpStatus.OK).json({message: RESET_SENT_MESSAGE});
}

const resetPassword = async (req, res) => {
    const {token, password} = req.body;
    if(typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
        return res.status(httpStatus.BAD_REQUEST).json({message: "This reset link isn't valid. Request a new one."});
    }
    if(!isValidPassword(password)) return res.status(httpStatus.BAD_REQUEST).json({message: "Password must be 8-72 characters"});

    const user = await User.findOne({resetTokenHash: hashToken(token), resetExpiresAt: {$gt: new Date()}});
    if(!user) return res.status(httpStatus.BAD_REQUEST).json({message: "This reset link has expired or was already used. Request a new one."});

    user.password = await bcrypt.hash(password, 10);
    user.resetTokenHash = undefined;
    user.resetExpiresAt = undefined;
    user.resetSentAt = undefined;
    await user.save();
    // Whoever knew the old password is signed out everywhere.
    await Session.deleteMany({user: user._id});
    return res.status(httpStatus.OK).json({message: "Your password has been changed. Sign in with your new password."});
}

// Lets accounts created before emails were collected add one, so they can recover their password too.
const updateEmail = async (req, res) => {
    const email = normalizeEmail(req.body.email);
    if(!isValidEmail(email)) return res.status(httpStatus.BAD_REQUEST).json({message: "Please enter a valid email address"});
    if(await emailTaken(email, req.user._id)) return res.status(httpStatus.CONFLICT).json({message: "That email is already used by another account"});

    req.user.email = email;
    await req.user.save();
    return res.status(httpStatus.OK).json({message: "Email saved. You can now reset your password by email.", email});
}

const logout = async (req, res) => {
    await Session.deleteOne({_id: req.session._id});
    return res.status(httpStatus.OK).json({message: "Signed out"});
};

const getProfile = async (req, res) => {
    return res.status(httpStatus.OK).json({
        user: {name: req.user.name, username: req.user.username, email: req.user.email || null}
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

export {getIceServers, login, register, logout, forgotPassword, resetPassword, updateEmail, getProfile, addActivity, getAllActivity};