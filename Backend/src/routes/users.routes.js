import {Router} from "express";
import {login, register, forgotPassword} from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/forgot-password").post(forgotPassword);
router.route("/add_to_activity")
router.route("/get_all_activity")

export default router;
