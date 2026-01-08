const express = require("express");
const router = express.Router();
const auth  = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

const {
    createRating,
    updateRating,
    deleteRating,
    getRatings,
    deletedList,
    restoreRating
} = require("../controllers/ratingController");

router.post("/create", auth, roleCheck(["admin","customer"]), createRating);
router.post("/update", auth, roleCheck(["admin","customer"]), updateRating);
router.post("/delete", auth, roleCheck(["admin"]), deleteRating);
router.post("/restore", auth, roleCheck(["admin"]), restoreRating);
router.post("/list", auth, roleCheck(["admin","customer"]), getRatings);
router.post("/list/delete", auth, roleCheck(["admin"]), deletedList);

module.exports = router;