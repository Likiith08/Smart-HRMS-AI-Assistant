"use strict";

const aiService = require("../services/aiService");

const chat = async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    if (!message) return res.status(400).json({ success: false, message: "message is required" });
    if (message.length > 2000) return res.status(400).json({ success: false, message: "message must be 2000 characters or less" });

    const result = await aiService.chat({ message, user: req.user });
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("AI chat error:", error);
    return res.status(500).json({ success: false, message: "AI assistant request failed" });
  }
};

const intent = async (req, res) => {
  const message = String(req.body.message || "").trim();
  if (!message) return res.status(400).json({ success: false, message: "message is required" });
  return res.json({ success: true, data: { intent: aiService.detectIntent(message) } });
};

const health = async (req, res) => res.json({ success: true, data: await aiService.health() });

module.exports = { chat, intent, health };
