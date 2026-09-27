const { body, param } = require("express-validator");

const idParamValidation = [
    param("id").isMongoId().withMessage("Invalid product id"),
];

const createProductValidation = [
    body("name").trim().notEmpty().withMessage("Product name is required"),

    body("description")
        .optional()
        .trim()
        .isString()
        .withMessage("Description must be a string"),

    body("price")
        .notEmpty()
        .withMessage("Price is required")
        .isFloat({ gt: 0 })
        .withMessage("Price must be a number greater than 0"),

    body("stock")
        .notEmpty()
        .withMessage("Stock is required")
        .isInt({ min: 0 })
        .withMessage("Stock must be a whole number of 0 or more"),

    body("image")
        .optional({ checkFalsy: true })
        .isString()
        .withMessage("Image must be a string")
        .isLength({ max: 5_000_000 })
        .withMessage("Image is too large (max ~5MB)")
        .matches(/^data:image\/(png|jpe?g|gif|webp);base64,/)
        .withMessage("Image must be a valid base64 image data URL"),
];

const updateProductValidation = [
    ...idParamValidation,

    body("name")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Product name cannot be empty"),

    body("description")
        .optional()
        .trim()
        .isString()
        .withMessage("Description must be a string"),

    body("price")
        .optional()
        .isFloat({ gt: 0 })
        .withMessage("Price must be a number greater than 0"),

    body("stock")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Stock must be a whole number of 0 or more"),

    body("image")
        .optional({ checkFalsy: true })
        .isString()
        .withMessage("Image must be a string")
        .isLength({ max: 5_000_000 })
        .withMessage("Image is too large (max ~5MB)")
        .matches(/^data:image\/(png|jpe?g|gif|webp);base64,/)
        .withMessage("Image must be a valid base64 image data URL"),
];

module.exports = {
    idParamValidation,
    createProductValidation,
    updateProductValidation,
};
