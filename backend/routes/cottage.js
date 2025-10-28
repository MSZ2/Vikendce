const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

router.get('/', homeController.getCottages);
router.get('/:id', homeController.getCottageDetails);

module.exports = router;