import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import canteenRouter from "./canteen.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(canteenRouter);

export default router;
