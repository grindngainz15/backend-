const createUploader = require("./cloudinaryUpload");

module.exports = {
  uploadCategoryImage: createUploader("categories"),
  uploadBrandLogo: createUploader("brands"),
  uploadProductImages: createUploader("products"),
};
