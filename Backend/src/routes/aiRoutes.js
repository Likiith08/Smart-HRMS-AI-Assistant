const express = require("express");
const controller = require("../controllers/aiController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/health", authenticate, controller.health);
router.post("/intent", authenticate, controller.intent);
router.post("/chat", authenticate, controller.chat);

module.exports = router;
