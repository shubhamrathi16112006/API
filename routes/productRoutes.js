const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, minRole } = require('../middleware/roleMiddleware');

// All product routes require a valid JWT
router.use(protect);

// Any logged-in role (employee, manager, admin) can read
router.get('/', getProducts);
router.get('/:id', getProductById);

// Manager and admin can create/update
router.post('/', minRole('manager'), createProduct);
router.put('/:id', minRole('manager'), updateProduct);
router.patch('/:id', minRole('manager'), updateProduct);

// Only admin can delete
router.delete('/:id', authorize('admin'), deleteProduct);

module.exports = router;
