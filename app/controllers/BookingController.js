const createError = require('http-errors');

const Book = require('../models/Book');
const Booking = require('../models/Booking');

const BookingController = {
    /**
     * GET /api/books/bookings/
     * Returns bookings with the given status
     * Expects: {
     *      params: status
     *      header: bearer-token
     * }
     * Responds: {
     *      200: { body: bookings }     // success
     *      401: {}                     // unauthorized for not logged in users
     *      403: {}                     // forbidden for non moderator users
     *      500: {}                     // internal error
     * }
     */
    getAllBookings: (req, res, next) => {
        // only moderators have access
        if (!req.user.isModerator) {
            return next(createError(403, 'user not authorized for this action'));
        }

        // find all the bookings
        Booking.find({},{},{
            sort: {
                updatedAt: -1
            }
        })
            .catch( (err) => {
                return next(err);
            })
            .then( (bookings) => {
                // respond with the bookings
                res.json({
                    message: 'succesfully retrieved bookings',
                    bookings: bookings
                });
            });
    },
    
    /**
     * GET /api/books/bookings/:status
     * Returns bookings with the given status
     * Expects: {
     *      params: status
     *      header: bearer-token
     * }
     * Responds: {
     *      200: { body: bookings }     // success
     *      401: {}                     // unauthorized for not logged in users
     *      403: {}                     // forbidden for non moderator users
     *      422: {}                     // invalid data
     *      500: {}                     // internal error
     * }
     */
    getBookingsWithStatus: (req, res, next) => {
        // only moderators have access
        if (!req.user.isModerator) {
            return next(createError(403, 'user not authorized for this action'));
        }

        // find all the bookings with this status
        Booking.find({
            status: req.params.status
        },{},{
            sort: {
                updatedAt: -1
            }
        })
            .catch( (err) => {
                return next(err);
            })
            .then( (bookings) => {
                // respond with the bookings
                res.json({
                    message: 'succesfully retrieved bookings',
                    bookings: bookings
                });
            });
    },

    /**
     * GET /api/users/me/bookings
     * Returns bookings done by the current user
     * Expects: {
     *      params: user._id
     *      header: bearer-token
     * }
     * Responds: {
     *      200: { body: bookings }     // success
     *      401: {}                     // unauthorized for not logged in users
     *      403: {}                     // forbidden for non moderator users != user
     *      404: {}                     // user not found
     *      500: {}                     // internal error
     * }
     */
    getBookingsByUser: (req, res, next) => {
        // find all the bookings by user
        Booking.find({
            user_id: req.user._id
        },{},{
            sort: {
                updatedAt: -1
            }
        })
            .catch( (err) => {
                return next(err);
            })
            .then( (bookings) => {
                // respond with the bookings
                res.json({
                    message: 'succesfully retrieved user bookings',
                    bookings: bookings
                });
            });
    },

    /**
     * GET /api/books/:id/bookings
     * Returns bookings done by all user for given book
     * Expects: {
     *      params: book._id
     *      header: bearer-token
     * }
     * Responds: {
     *      200: { body: bookings }     // success
     *      401: {}                     // unauthorized for not logged in users
     *      403: {}                     // forbidden for non moderators
     *      404: {}                     // book not found
     *      500: {}                     // internal error
     * }
     */
    getAllBookingsForBook: (req, res, next) => {
        // only moderators have access to this
        if (!req.user.isModerator) {
            return next(createError(403, 'user not authorized for this action'));
        }

        const targetBookID = req.params.id;

        // look for the book in db
        Book.findById(targetBookID)
            .catch( (err) => {
                return next(err);
            })    
            .then( (book) => {
                // book does not exist
                if (!book) {
                    return next(createError(404, 'book does not exist'));
                }
                // find all the bookings for the book
                Booking.find({
                    book_id: targetBookID
                },{},{
                    sort: {
                        updatedAt: -1
                    }
                })
                    .catch( (err) => {
                        return next(err);
                    })
                    .then( (bookings) => {
                        // respond with the bookings
                        res.json({
                            message: 'succesfully retrieved user bookings for book',
                            bookings: bookings
                        });
                    });
            });
    },

    /**
     * GET /api/books/:id/bookings/me
     * Returns bookings done by current user for given book
     * Expects: {
     *      params: book._id
     *      header: bearer-token
     * }
     * Responds: {
     *      200: { body: bookings }     // success
     *      401: {}                     // unauthorized for not logged in users
     *      404: {}                     // book not found
     *      500: {}                     // internal error
     * }
     */
    getUserBookingsForBook: (req, res, next) => {
        const targetBookID = req.params.id;

        // look for the book in db
        Book.findById(targetBookID)
            .catch( (err) => {
                return next(err);
            })    
            .then( (book) => {
                // book does not exist
                if (!book) {
                    const err = createError(404, 'book does not exist');

                    return next(err);
                }
                // find all the bookings made by current user for this book
                Booking.find({ 
                    user_id: req.user._id,
                    book_id: targetBookID
                },{},{
                    sort: {
                        updatedAt: -1
                    }
                })
                    .catch( (err) => {
                        return next(err);
                    })
                    .then( (bookings) => {
                        // respond with the bookings
                        res.json({
                            message: 'succesfully retrieved user bookings for book',
                            bookings: bookings
                        });
                    });
            });
    },

    /**
     * POST /api/books/:id/bookings
     * Expects: {
     *      params: book._id
     *      body:   quantity
     *      header: bearer-token
     * }
     * Creates a booking for the current user
     * Returns the new booking id
     * Responds: {
     *      200: { body: booking }      // success
     *      401: {}                     // unauthorized for not logged in users
     *      404: {}                     // book not found
     *      422: {}                     // invalid data
     *      500: {}                     // internal error
     * }
     */
    addBooking: (req, res, next) => {
        // create the booking
        Booking.create({
            user_id: req.user._id,
            book_id: req.params.id,
            quantity: req.body.quantity,
            status: 'pending'
        })
            .catch( (err) => {
                return next(err);
            })    
            .then( (booking) => {
                // booking completed. return the id
                res.status(200).json({
                    message: 'successfully completed booking',
                    booking: booking._id
                });
            });
    },

    /**
     * PATCH /api/books/bookings/:id
     * Expects: {
     *      params: booking._id
     *      body:   quantity (optional), status (optional)
     *      header: bearer-token
     * }
     * Updates a booking for the user
     * Returns the updated booking id
     * Responds: {
     *      200: { body: booking }      // success
     *      401: {}                     // unauthorized for not logged in users
     *      403: {}                     // forbidden actions attempted
     *      404: {}                     // book not found
     *      422: {}                     // invalid data
     *      500: {}                     // internal error
     * }
     */
    updateBooking: (req, res, next) => {
        // look up the booking in db
        const targetBookingID = req.params.id;

        Booking.findById(targetBookingID)
            .catch( (err) => {
                return next(err);
            })
            .then( (booking) => {
                // booking exists
                booking.quantity = req.body.quantity;
                booking.status = req.body.status;

                // save the booking
                booking.save()
                    .catch( (err) => {
                        return next(err);
                    })
                    .then( (updatedBooking) => {
                        res.status(200).json({
                            message: 'successfully updated booking',
                            booking: updatedBooking._id
                        });
                    });
            });
    }
    
};

module.exports = BookingController;