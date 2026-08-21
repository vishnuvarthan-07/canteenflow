import { Router, type IRouter } from "express";
import healthRouter from "./health";
import canteenRouter from "./canteen";

const router: IRouter = Router();

router.use(healthRouter);
router.use(canteenRouter);

export default router;
