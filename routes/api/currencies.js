const express = require('express');
const router = express.Router();
const moment = require('moment');
const fetch = require('node-fetch');

// @route   GET api/actions/rangeDate
// @desc    Get min and max dates
// @access  Private

router.get('/', async (req, res) => {
    try {
        const currencies = await fetch(`https://api.privatbank.ua/p24api/exchange_rates?json&date=${moment().format('DD.MM.YYYY')}`, {
            method: 'GET'
        });
        const currenciesParse = await currencies.json();
        return res.status(200).json(currenciesParse);
    } catch (e) {
        console.log(e.message);
        res.status(500).send('Server Error')
    }
});

module.exports = router;
