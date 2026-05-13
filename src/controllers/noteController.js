import Note from "../models/Note.js";
import cloudinary from "../config/cloudinary.js";
import mammoth from "mammoth";
import officeParser from "officeparser";

const extractTextFromFile = async (file) => {
  const mime = file.mimetype;

  if (
    mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  if (
    mime ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return await officeParser.parseOfficeAsync(file.buffer, {
      outputErrorToConsole: true,
    });
  }

  if (mime === "text/plain") {
    return file.buffer.toString("utf-8");
  }

  return null;
};

const getFileType = (mime) => {
  const map = {
    "application/pdf": "pdf",
    "image/jpeg": "image",
    "image/png": "image",
    "image/webp": "image",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "pptx",
    "text/plain": "txt",
  };
  return map[mime] || "text";
};

export const createNote = async (req, res) => {
  try {
    const { title, tags, tone } = req.body;
    let { content } = req.body;
    let fileUrl = "";
    let extractedText = "";
    let type = "text";

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (req.file) {
      type = getFileType(req.file.mimetype);
      extractedText = await extractTextFromFile(req.file);

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "echo-app/notes",
            resource_type: type === "image" ? "image" : "raw",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        stream.end(req.file.buffer);
      });

      fileUrl = uploadResult.secure_url;
      content = extractedText || "";
    } else {
      if (!content) {
        return res
          .status(400)
          .json({ message: "Content is required for text notes" });
      }
      type = "text";
    }

    const note = await Note.create({
      userId: req.user._id,
      title,
      type,
      content,
      fileUrl,
      tags: tags ? JSON.parse(tags) : [],
      tone: tone || "simple",
    });

    res.status(201).json({ note });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ notes });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getNote = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json({ note });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.fileUrl) {
      const publicId = note.fileUrl
        .split("/")
        .slice(-2)
        .join("/")
        .split(".")[0];
      await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
    }

    await note.deleteOne();
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
