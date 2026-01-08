const express = require("express");
const morgan = require("morgan");
const connectDB = require("./config/db");
const cors = require("cors");
require("dotenv").config();

connectDB();

// Import Routes
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const brandRoutes = require("./routes/brandRoutes"); // FIXED
const productRoutes = require("./routes/productRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

/* ================= MORGAN CONFIG ================= */
if (process.env.NODE_ENV === "development") {
  morgan.token("body", (req) => JSON.stringify(req.body));

  morgan.token("datetime", () =>
    new Date().toLocaleString("en-IN")
  );

  morgan.token("ip", (req) =>
    req.ip || req.connection.remoteAddress
  );

  const format =
    ":datetime | IP: :ip | :method :url :status :res[content-length] | Payload: :body";

  app.use(morgan(format));
}

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= ROUTES ================= */
app.get("/", (req, res) => {
  res.json({ message: "Hey Dumbo" });
});

app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/products", productRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/wishlists", wishlistRoutes);
app.use("/api/orders", orderRoutes);

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`⚡ Server running on port ${PORT} Mode: ${process.env.NODE_ENV}`);
});
