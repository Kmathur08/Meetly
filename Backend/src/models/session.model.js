import mongoose, {Schema} from "mongoose";

const sessionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    // Only a SHA-256 hash is stored, so a database leak doesn't hand out live sessions.
    tokenHash: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

// MongoDB's TTL monitor removes expired sessions on its own.
sessionSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

const Session = mongoose.model("Session", sessionSchema);

export {Session};
