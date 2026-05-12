'use strict';

const crypto = require('crypto');
const path = require('path');
const cosClient = require('../utils/cos-client');

const BUCKET = 'personal-site-media';

/**
 * 上传媒体文件
 * @param {Buffer} fileBuffer - 文件内容
 * @param {string} filename - 原始文件名
 * @param {string} contentType - MIME 类型
 * @param {string} folder - 目标文件夹（wallpapers, avatars）
 * @returns {Promise<object>} 包含公开访问 URL
 */
async function upload(fileBuffer, filename, contentType, folder) {
  const allowedFolders = ['wallpapers', 'avatars'];
  if (!allowedFolders.includes(folder)) {
    throw new Error(`Invalid folder: ${folder}. Allowed: ${allowedFolders.join(', ')}`);
  }

  const ext = path.extname(filename) || '.jpg';
  const uuid = crypto.randomUUID();
  const key = `${folder}/${uuid}${ext}`;

  await cosClient.putObject(BUCKET, key, fileBuffer, contentType);

  // media 桶是公有读，返回公开 URL
  const url = cosClient.getPublicUrl(BUCKET, key);

  return {
    key,
    url,
    filename: `${uuid}${ext}`,
  };
}

/**
 * 删除媒体文件
 * @param {string} key - 文件的 COS key
 * @returns {Promise<void>}
 */
async function remove(key) {
  await cosClient.deleteObject(BUCKET, key);
}

module.exports = {
  upload,
  remove,
};
