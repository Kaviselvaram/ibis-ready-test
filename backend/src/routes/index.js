import { Router } from "express";

import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";
import userRoutes from "./user.routes.js";
import contentRoutes from "./content.routes.js";
import studentRoutes from "./student.routes.js";
import batchRoutes from "./batch.routes.js";
import courseRoutes from "./course.routes.js";
import questionRoutes from "./question.routes.js";
import testRoutes from "./test.routes.js";
import analyticsRoutes from "./analytics.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/content", contentRoutes);
router.use("/student", studentRoutes);
router.use("/batch", batchRoutes);
router.use("/course", courseRoutes);
router.use("/question", questionRoutes);
router.use("/test", testRoutes);
router.use("/analytics", analyticsRoutes);
export default router;
