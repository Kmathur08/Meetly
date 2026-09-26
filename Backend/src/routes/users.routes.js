import {Router} from "express";
import {login, register, forgotPassword, getProfile, addActivity, getAllActivity} from "../controllers/user.controller.js";
import {User} from "../models/users.models.js";

const authGuard = async (req, res, next) => {
	const token = req.headers.authorization?.replace("Bearer ", "");
	if(!token) return res.status(401).json({message: "Authentication required"});

	const user = await User.findOne({token});
	if(!user) return res.status(401).json({message: "Session expired"});
	req.user = user;
	next();
};

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/forgot-password").post(forgotPassword);
router.route("/me").get(authGuard, getProfile);
router.route("/add_to_activity").post(authGuard, addActivity);
router.route("/get_all_activity").get(authGuard, getAllActivity);

export default router;
