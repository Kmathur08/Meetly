import mongoose, {Schema} from "mongoose";

const meetingSchema = new Schema({
    // Mixed so rows saved before the switch to ObjectId (stored as strings) still load.
    user_id: {
        type: Schema.Types.Mixed,
        required: true
    },
    meetingcode: { 
        type: String,
        required: true,
        trim: true,
        maxlength: 40
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    }
});

meetingSchema.index({user_id: 1, date: -1});

const Meeting = mongoose.model("Meeting", meetingSchema);

export {Meeting};
