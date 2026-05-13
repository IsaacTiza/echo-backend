import express from "express";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import {
  createNote,
  getNotes,
  getNote,
  deleteNote,
} from "../controllers/noteController.js";

const router = express.Router();

router.get("/", protect, getNotes);
router.get("/:id", protect, getNote);
router.post("/", protect, upload.single("file"), createNote);
router.delete("/:id", protect, deleteNote);

export default router;
