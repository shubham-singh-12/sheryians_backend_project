const express = require('express');
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const {
  idParamValidation,
  createProductValidation,
  updateProductValidation,
} = require('../validations/productValidation');

router.post('/', authenticate, createProductValidation, validate, createProduct);
router.get('/', getProducts);
router.get('/:id', idParamValidation, validate, getProductById);
router.put('/:id', authenticate, updateProductValidation, validate, updateProduct);
router.delete('/:id', authenticate, idParamValidation, validate, deleteProduct);

module.exports = router;
