import {Schema} from "mongoose";
import mongoose from "mongoose";

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true 
    },
    // Optional because accounts made before password reset existed have none; sparse keeps the
    // unique index from treating all of those missing values as duplicates.
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        sparse: true
    },
    // Password reset: only a hash of the emailed token is stored, like session tokens.
    resetTokenHash: String,
    resetExpiresAt: Date,
    resetSentAt: Date
});

const User = mongoose.model("User", userSchema);

export {User};