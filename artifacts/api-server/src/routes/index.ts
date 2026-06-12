import { Router, type IRouter } from "express";
import healthRouter from "./health";
import translationRouter from "./translation";
import glossariesRouter from "./glossaries";

const router: IRouter = Router();

router.use(healthRouter);
router.use(translationRouter);
router.use(glossariesRouter);

export default router;
