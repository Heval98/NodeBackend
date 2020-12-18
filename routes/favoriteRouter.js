const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Favorite = require('../models/favorites');

const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.corsWithOptions, authenticate.verifyOrdinaryUser, (req, res, next) => {
    var user_id = req.user._id;
    Favorite.findOne({user: user_id}).populate('user').populate('dishes')
    .then(favorite => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite)
    }, err => next(err))
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyOrdinaryUser, (req, res, next) => {
    console.log(req.body);
    console.log(req.user);

    var user_id = req.user._id;
    Favorites.findOne({user: user_id})
    .then(favorites => {
        var fav = favorites;
        if (fav === null) {
            Favorites.create({
                user: user_id,
                dishes: []
            })
            .then(favorites => {
                req.body.map( dishId => {
                    favorites.dishes.push(dishId._id);
                })
                favorites.save()
                .then(favorites => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites)
                }, err => next(err))
                .catch(err => next(err));
            }, err => next(err))
            .catch( err => next(err));
        }
        else {
            req.body.map( dishId => {
                var found = fav.dishes.filter( dish => {
                    return dish.equals(dishId._id)
                }).length >= 1;
                if (!found) {
                    fav.dishes.push(dishId._id);
                }
            })
            fav.save()
            .then(favorites => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites)
            }, err => next(err))
            .catch(err => next(err));
        }
        
    }, err => next(err))
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyOrdinaryUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(` PUT operation is not supported on /favorites `);
})
.delete(cors.corsWithOptions, authenticate.verifyOrdinaryUser, (req, res, next) => {
    var user_id = req.user._id;
    Favorites.deleteOne({"user": user_id})
    .then(favorites => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites)
    }, err => next(err))
    .catch(err => next(err));

});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.corsWithOptions, authenticate.verifyOrdinaryUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`GET operation on /favorites/${req.params.dishId} is not allowed`);
})
.put(cors.corsWithOptions,  authenticate.verifyOrdinaryUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`PUT operation on /favorites/${req.params.dishId} is not allowed`);
})
.post(cors.corsWithOptions, authenticate.verifyOrdinaryUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then(favorites => {
        if (favorites === null) {
            Favorites.create({user: req.user._id, dishes: [req.params.dishId]})
            .then(favourite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favourite);
            }, err => next(err))
            .catch(err => next(err))
        } else {
            var found = favorites.dishes.filter( dish => dish._id.equals(req.params.dishId)).length >= 1;
            if (!found) {
                favorites.dishes.push(req.params.dishId);
            }
            favorites.save()
            .then(favourite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favourite);
            }, err => next(err))
            .catch(err => next(err))
        }
    }, err => next(err))
    .catch( err => next(err))
})
.delete(cors.corsWithOptions, authenticate.verifyOrdinaryUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then(favorites => {
        if (favorites === null) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'text/plain');
            res.end(` dish: ${req.params.dishId} is not your favourite. No need to remove.`);
        } else {
            var found = favorites.dishes.filter( dish => dish._id.equals(req.params.dishId)).length >= 1;
            if (found) {
                if (favourite.dishes.length === 1) {
                    Favorites.deleteOne({"user": req.user._id})
                    .then(favorites => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites)
                    }, err => next(err))
                    .catch(err => next(err));
                }
                else {
                    favorites.dishes.remove(req.params.dishId);
                    favorites.save()
                    .then(favourite => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favourite);
                    }, err => next(err))
                    .catch(err => next(err))
                }
            } else {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/plain');
                res.end(` dish: ${req.params.dishId} is not your favourite. No need to remove.`);
            }
        }
    }, err => next(err))
    .catch( err => next(err))
})


module.exports = favoriteRouter;