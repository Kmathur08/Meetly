import httpStatus from "http-status";
import bcrypt, {hash} from "bcrypt";
import {User} from "../models/users.models.js";
import crypto from "crypto"; 


const login = async (req, res) => {
    const {username, password} = req.body;

    if(!username || !password) return res.status(httpStatus.BAD_REQUEST).json({message: "Please provide username and password"});

    try {
        const user = await User.findOne({username});

        if(!user) return res.status(httpStatus.NOT_FOUND).json({message: "User not found"});

        if(bcrypt.compare(password, user.password)) {
            let token = crypto.randomBytes(20).toString("hex");

            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({message: "Login successful", token});
        }
    } catch(e) {
        return res.status(500).json({message: `Something went wrong ${e}. Please Try again`})
    }
}

const register =  async (req, res) => {
    const {name,username,password} = req.body;

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
        res.status(httpStatus.CREATED).json({message: "User registered successfully"});

    } catch(e) {
        res.json({message: `Something went wrong ${e}. Please Try again`})
    }
}

export {login, register};