// アイコン画像アップロードの許可形式・サイズ上限。
// クライアント(addIcon.js)とサーバー(profile/actions.js)の両方から参照する。
export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const AVATAR_MAX_SIZE_LABEL = "5MB";

export const AVATAR_CONTENT_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export const AVATAR_ALLOWED_LABEL = "PNG・JPG・GIF・WEBP";

function extensionOf(filename) {
  return filename?.split(".").pop()?.toLowerCase();
}

export function getAvatarContentType(filename) {
  return AVATAR_CONTENT_TYPES[extensionOf(filename) ?? ""] ?? null;
}

export function isAllowedAvatarFile(filename) {
  return getAvatarContentType(filename) !== null;
}

// iPhoneのカメラは既定でHEIC/HEIFで撮影されるため、この拡張子だけは
// アップロード前にクライアント側でJPEGへ変換してから許可リストに乗せる
// （HEICのままだとSafari以外のブラウザで表示できないため）
export function isHeicFile(filename) {
  return extensionOf(filename) === "heic" || extensionOf(filename) === "heif";
}

export function isAllowedAvatarSize(sizeBytes) {
  return typeof sizeBytes === "number" && sizeBytes > 0 && sizeBytes <= AVATAR_MAX_SIZE_BYTES;
}
