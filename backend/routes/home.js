const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

router.get('/stats', homeController.getHomeStats);

module.exports = router;