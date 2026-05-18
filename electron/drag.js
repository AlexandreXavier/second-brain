function parseUriList(text) {
  return (
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0 && !line.startsWith("#")) ?? null
  );
}

function isImagePath(filePath) {
  return /\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(filePath);
}

module.exports = { parseUriList, isImagePath };
