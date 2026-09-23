import {Router} from "express";
import {login, register, logout, forgotPassword, getProfile, addActivity, getAllActivity} from "../controllers/user.controller.js";
import {authGuard} from "../middleware/auth.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/logout").post(authGuard, logout);
router.route("/forgot-password").post(forgotPassword);
router.route("/me").get(authGuard, getProfile);
router.route("/add_to_activity").post(authGuard, addActivity);
router.route("/get_all_activity").get(authGuard, getAllActivity);

export default router;
