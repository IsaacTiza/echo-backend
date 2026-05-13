import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["text", "pdf", "image", "docx", "pptx", "txt"],
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    fileUrl: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    explanation: {
      type: String,
      default: "",
    },
    tone: {
      type: String,
      enum: ["simple", "detailed", "eli5", "academic", "bullet"],
      default: "simple",
    },
  },
  { timestamps: true },
);

// Ensure either content or fileUrl is present before saving
noteSchema.pre("save", function (next) {
  if (!this.content && !this.fileUrl) {
    return next(new Error("Note must have either content or a file URL"));
  }
  next();
});

// Instance method to check if note has been explained already
noteSchema.methods.hasExplanation = function () {
  return this.explanation && this.explanation.length > 0;
};

export default mongoose.model("Note", noteSchema);
