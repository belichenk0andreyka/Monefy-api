const mongoose = require('mongoose');
const express = require('express');
const _ = require('lodash');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');

const Action = require('../../models/Action');

// @route   POST api/actions/
// @desc    Create new action
// @access  Private

router.post('/', [auth, [
    check('category', 'Category is required').not().isEmpty(),
    check('price', 'Price is required').not().isEmpty(),
    check('type', 'Type is required').not().isEmpty(),
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(200).json({errors: errors.array()});
    }

    const { category, price, type, description } = req.body;
    try {
        const newAction = { type, price, category, user: req.user.id, description };
        const action = new Action(newAction);
        const saveAction = await action.save();
        res.json(saveAction);
    } catch (e) {
        console.log(e.message);
        res.status(500).send('Server Error')
    }
});

// @route   GET api/actions/
// @desc    Create new action
// @access  Private

router.get('/', auth, async (req, res) => {
    try {
        const { startDate, finishDate } = req.query;
        const actions = await Action.find({
            user: mongoose.Types.ObjectId(req.user.id),
            date: {$gte: startDate, $lt: finishDate},
        });
        const sendObj = {expenses: {categories: {}, chartData: {}}, income: {categories: {}}, financeInfo: {}};
        const arrayOfExpensesCategories = _.sortedUniq(actions.filter(item => !item.type).map(item => item.category));
        const arrayOfProfitCategories = _.sortedUniq(actions.filter(item => item.type).map(item => item.category));
        arrayOfExpensesCategories.forEach(uniq => {
            sendObj.expenses.categories[uniq] = actions.filter(action => action.category === uniq);
            sendObj.expenses.chartData[uniq] = _.reduce(actions.filter(action => action.category === uniq), function(sum, n) {
                return sum + n.price;
            }, 0);
        });
        arrayOfProfitCategories.forEach(uniq => {
            sendObj.income.categories[uniq] = actions.filter(action => action.category === uniq);
        });
        sendObj.financeInfo = {
            consumption: _.reduce(sendObj.expenses.chartData, function (result, value) {
                return result + value;
            }, 0),
            profit: _.reduce(sendObj.income.categories, function (result, value) {
                return result + _.reduce(value, function (count, item) {
                    return count + item.price;
                }, 0);
            }, 0),
        }
        res.json(sendObj);
    } catch (e) {
        console.log(e.message);
        res.status(500).send('Server Error')
    }
});

// @route   GET api/actions/rangeDate
// @desc    Get min and max dates
// @access  Private

router.get('/rangeDate', auth, async (req, res) => {
    try {
        const rangeDate = await Action.aggregate([
            {
                $match: {
                    user: mongoose.Types.ObjectId(req.user.id),
                }
            },
            {
                "$group": {
                    "_id": null,
                    "maxDate": { "$max": "$date" },
                    "minDate": { "$min": "$date" }
                }
            }
        ]);
        return res.status(200).json(rangeDate[0]);
    } catch (e) {
        console.log(e.message);
        res.status(500).send('Server Error')
    }
});

module.exports = router;
