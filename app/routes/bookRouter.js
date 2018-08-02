const express = require('express');

const auth = require('../controllers/AuthController');
const BC = require('../controllers/BookController');
const BKC = require('../controllers/BookingController');

const vc = auth.validatorChain;

const router = express.Router();

// user interactions
router.get('/', BC.getAllBooks);
router.post('/', vc.addBook(), BC.addBook);
router.post('/search', vc.search(), BC.searchBook);
router.get('/bookings', BKC.getAllBookings);
router.patch('/bookings/:id', vc.checkID(), vc.updateBooking(), BKC.updateBooking);
router.get('/bookings/:status', vc.getBookingsWithStatus(), BKC.getBookingsWithStatus);
router.get('/category/:category_name', vc.getBooksInCategory(), BC.getBooksInCategory);
router.get('/:id', vc.checkID(), BC.getBook);
router.patch('/:id', vc.checkID(), vc.updateBook(), BC.updateBook);
router.post('/:id/bookings', vc.checkID(), vc.addBooking(), BKC.addBooking);
router.get('/:id/bookings', vc.checkID(), BKC.getAllBookingsForBook);
router.get('/:id/bookings/me', vc.checkID(), BKC.getUserBookingsForBook);
router.post('/:id/category', vc.checkID(), vc.category(), BC.addToCategory);
router.delete('/:id/category', vc.checkID(), vc.category(), BC.removeFromCategory);

module.exports = router;