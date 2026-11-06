import {Router} from "express";
import {getIceServers, login, register, logout, forgotPassword, resetPassword, updateEmail, getProfile, addActivity, getAllActivity} from "../controllers/user.controller.js";
import {authGuard} from "../middleware/auth.js";
import {rateLimit} from "../middleware/rateLimit.js";

const router = Router();

const authLimiter = rateLimit({windowMs: 15 * 60 * 1000, max: 20});

router.route("/login").post(authLimiter, login);
router.route("/register").post(authLimiter, register);
router.route("/logout").post(authGuard, logout);
router.route("/forgot-password").post(authLimiter, forgotPassword);
router.route("/reset-password").post(authLimiter, resetPassword);
router.route("/email").post(authGuard, updateEmail);
router.route("/me").get(authGuard, getProfile);
router.route("/add_to_activity").post(authGuard, addActivity);
router.route("/get_all_activity").get(authGuard, getAllActivity);
router.route("/ice-servers").get(authGuard, getIceServers);

export default router;
