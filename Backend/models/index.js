"use strict";

// Backward-compatible bridge for scripts that still import Backend/models.
// The application source of truth is Backend/src/models.
module.exports = require("../src/models");
