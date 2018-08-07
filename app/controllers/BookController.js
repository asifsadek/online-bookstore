const createError = require('http-errors');

const Book = require('../models/Book');
const Category = require('../models/Category');

/**
 * Fetches the book profile, including its categories
 * @param {string} book_ids // array of book ids to fetch
 */
const getBookProfiles = (book_ids) => {
    return new Promise((resolve,reject) => {
        let promises = [];
        book_ids.forEach( (entry) => {
            promises.push(
                fetchBookProfile(entry)
            );
        });
        Promise.all(promises)
            .then( (books) => {
                // respond with book profiles
                resolve(books);
            })
            .catch( (err) => {
                reject(err);
            });
    });
};

/**
 * Fetches the book profile, including its categories
 * @param {string} book_id 
 */
const fetchBookProfile = (book_id) => {
    return new Promise((resolve,reject) => {
        Book.findById(book_id, {
            createdAt: false,
            updatedAt: false
        })
            .then( (book) => {
                // book not in db
                if (!book) {
                    reject(createError(404,'book not found'));
                } else {
                    // book found. find the category it belongs to.
                    Category.distinct('category_name',{
                        book_id: book._id
                    })
                        .then( (categories) => {
                            // respond with book profile
                            book = book.toObject();
                            book.categories = categories;
                            resolve(book);
                        })
                        .catch( (err) => {
                            reject(err);
                        });
                }
            })
            .catch( (err) => {
                reject(err);
            });
    });
};

const BookController = {

    /**
     * GET /api/books/
     * Returns all book profiles
     * Expects: {
     *      header: bearer-token
     * }
     * Responds: {
     *      200: { body: books }    // success
     *      401: {}                 // unauthorized for not logged in user
     *      500: {}                 // internal error
     * }
     */
    getAllBooks: (req, res, next) => {
        // look up books in db
        Book.distinct('_id')
            .then( (entries) => {
                getBookProfiles(entries)
                    .then( (books) => {
                        res.status(200).json({
                            message: 'books retrieved successfully',
                            books: books
                        });
                    })
                    .catch( (err) => {
                        return next(err);
                    });
            })
            .catch( (err) => {
                return next(err);
            });
    },

    /**
     * POST /api/books
     * Creates new book
     * Returns new book id
     * Expects: {
     *      body:   title, author, isbn
     *      header: bearer-token
     * }
     * Responds: {
     *      200: { body: book } // success
     *      401: {}             // unauthorized for not logged in users
     *      403: {}             // forbidden for users with no moderator access
     *      409: {}             // conflict with existing data
     *      422: {}             // invalid data provided
     *      500: {}             // internal error
     * }
     */
    addBook: (req, res, next) => {
        // check if the user has previlige for this
        if (!req.user.isModerator) {
            return next(createError(403, 'user not authorized for this action'));
        }
        
        // Credentials are okay
        const title = req.body.title;
        const author = req.body.author;
        const ISBN = req.body.ISBN;

        Book.findOne({ ISBN: ISBN })
            .then( (book) => {
                // same book exists
                if (book) {
                    return next(createError(409,'book already in collection'));
                }

                // duplicate does not exist. create new book
                Book.create({
                    title: title,
                    author: author,
                    ISBN: ISBN
                })
                    .then( (newBook) => {
                        // new book created
                        // send back the book id
                        res.status(200).json({
                            message: 'book successfully added',
                            book: newBook._id
                        });
                    })
                    .catch( (err) => {
                        return next(err);
                    });
            })
            .catch( (err) => {
                return next(err);
            });
    },

    /**
     * GET /api/books/:id
     * Returns book profile for the given id
     * Expects: {
     *      params: book._id
     *      header: bearer-token
     * }
     * Responds: {
     *      200: { body: book }             // success
     *      401: {}                         // unauthorized for not logged in user
     *      404: {}                         // book not found
     *      500: {}                         // internal error
     * }
     */
    getBook: (req, res, next) => {        
        // request is okay. look up the book
        fetchBookProfile(req.params.id)
            .then( (book) => {
                res.status(200).json({
                    message: 'successfully retrieved book',
                    book: book
                });
            })
            .catch( (err) => {
                return next(err);
            });
    },

    /**
     * PATCH /api/books/:id
     * Updates book data
     * Returns book id
     * Expects: {
     *      params: book._id
     *      body:   title (optional), author (optional)
     *      header: bearer-token
     * }
     * Responds: {
     *      200: { body: user } // success
     *      401: {}             // unauthorized for not logged in user
     *      403: {}             // forbidden (no moderator access, changing isbn )
     *      404: {}             // book not found
     *      422: {}             // invalid data provided
     *      500: {}             // internal error
     * }
     */
    updateBook: (req, res, next) => {
        // validated book id
        const targetBookID = req.params.id;
        
        // look up the book in db
        Book.findById(targetBookID)
            .then( (targetBook) => {
                targetBook.title = req.body.title;
                targetBook.author = req.body.author;
                
                // save changed data in database
                targetBook.save()
                    .then( (updatedBook) => {
                        res.status(200).json({
                            message: 'book updated successfully',
                            book: updatedBook._id
                        });
                    })
                    .catch( (err) => {
                        return next(err);
                    });
            })
            .catch( (err) => {
                return next(err);
            });
    },

    /**
     * GET /api/books/search
     * Fetches all the books that match the search
     * Expects: {
     *      query:  search
     *      header: bearer-token
     * }
     * Responds: {
     *      200: { body: books }    // success
     *      401: {}                 // unauthorized for not logged in users
     *      500: {}                 // internal error
     * }
     */
    searchBook: (req,res,next) => {
        const search = req.query.search;

        if (search.length === 0) {
            // search field does not exist or is empty
            res.status(200).json({
                message: 'search results',
                books: []
            });
        } else {
            // look for the searched string
            Book.find({
                $text: {
                    $search: search
                }
            },{
                score: {
                    $meta: 'textScore'
                }
            }, {
                sort: {
                    score: {
                        $meta: 'textScore'
                    }
                }
            })
                .then( (entries) => {
                    let promises = [];
                    entries.forEach( (entry) => {
                        promises.push(
                            fetchBookProfile(entry._id)
                        );
                    });
                    Promise.all(promises)
                        .then( (books) => {
                        // respond with book profiles
                            res.status(200).json({
                                message: 'books retrieved successfully',
                                books: books
                            });
                        })
                        .catch( (err) => {
                            return next(err);
                        });
                })
                .catch( (err) => {
                    return next(err);
                });
        }
    },
    getBookProfiles: getBookProfiles
};

module.exports = BookController;
