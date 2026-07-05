import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", maxlength: 1000 },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    brand: { type: String, default: "" },
    category: { type: String, required: true, index: true },
    image: { type: String, default: "" },

    price: { type: Number, required: true, min: 0 }, // in paise-free rupees
    mrp: { type: Number, default: 0 }, // for honest strike-through pricing (no drip pricing)
    countInStock: { type: Number, required: true, min: 0, default: 0 },

    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },

    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Recompute aggregate rating whenever reviews change.
productSchema.methods.recomputeRating = function () {
  this.numReviews = this.reviews.length;
  this.rating =
    this.reviews.length === 0
      ? 0
      : Math.round(
          (this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length) * 10
        ) / 10;
};

productSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Product", productSchema);
