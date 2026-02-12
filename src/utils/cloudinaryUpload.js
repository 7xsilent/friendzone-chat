import axios from "axios";

const CLOUD_NAME = "dkkjjiam2";
const UPLOAD_PRESET = "dkkjjiam2";

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  // IMPORTANT: use AUTO for everything
  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    formData
  );

  return res.data.secure_url;
};
