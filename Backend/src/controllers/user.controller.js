import httpStatus from "http-status";
import bcrypt from "bcrypt";
import {User} from "../models/users.models.js";
import crypto from "crypto"; 
import {Meeting} from "../models/meeting.model.js";


const login = async (req, res) => {
    const {username, password} = req.body;

    if(!username || !password) return res.status(httpStatus.BAD_REQUEST).json({message: "Please provide username and password"});

    try {
        const user = await User.findOne ({username});

        if(!user) return res.status(httpStatus.NOT_FOUND).json({message: "User not found"});

        if(await bcrypt.compare(password, user.password)) {
            let token = crypto.randomBytes(20).toString("hex");

            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({message: "Login successful", token});
        }

        return res.status(httpStatus.UNAUTHORIZED).json({message: "Invalid username or password"});
    } catch(e) {
        return res.status(500).json({message: `Something went wrong ${e}. Please Try again`})
    }
}

const register =  async (req, res) => {
    const {name,username,password} = req.body;

    if(!name || !username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({message: "Name, username, and password are required"});
    }

    if(password.length < 8) {
        return res.status(httpStatus.BAD_REQUEST).json({message: "Password must be at least 8 characters"});
    }

    try{
        const existingUser = await User.findOne({username});

        if(existingUser) return res.status(httpStatus.FOUND).json({message: "User already exists"});

        const hashpassword = await bcrypt.hash(password, 10);

        const newuser = new User({
            name : name,
            username : username,
            password : hashpassword
        });

        await newuser.save();
        return res.status(httpStatus.CREATED).json({message: "User registered successfully"});

    } catch(e) {
        return res.status(500).json({message: `Something went wrong ${e}. Please Try again`})
    }
}

const forgotPassword = async (req, res) => {
    const {username} = req.body;

    if(!username) {
        return res.status(httpStatus.BAD_REQUEST).json({message: "Please provide your username"});
    }

    await User.exists({username});
    return res.status(httpStatus.OK).json({message: "If an account exists, password reset instructions will be sent shortly."});
}

const getProfile = async (req, res) => {
    return res.status(httpStatus.OK).json({
        user: {name: req.user.name, username: req.user.username}
    });
};

const addActivity = async (req, res) => {
    const {meetingcode} = req.body;
    if(!meetingcode) return res.status(httpStatus.BAD_REQUEST).json({message: "Meeting code is required"});

    const meeting = await Meeting.create({user_id: req.user._id.toString(), meetingcode});
    return res.status(httpStatus.CREATED).json({meeting});
};

const getAllActivity = async (req, res) => {
    const meetings = await Meeting.find({user_id: req.user._id.toString()}).sort({date: -1}).limit(50);
    return res.status(httpStatus.OK).json({meetings});
};

export {login, register, forgotPassword, getProfile, addActivity, getAllActivity};