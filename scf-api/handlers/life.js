'use strict';

const crypto = require('crypto');
const path = require('path');
const cosClient = require('../utils/cos-client');

const BUCKET = 'personal-site-life';

/**
 * 获取生活记录列表
 * @returns {Promise<object>}
 */
async function list() {
  const data = await cosClient.getObject(BUCKET, 'life-posts.json');
  return data || [];
}

/**
 * 更新生活记录
 * @param {object} data - 生活记录数据
 * @returns {Promise<object>}
 */
async function update(data) {
  await cosClient.putObject(BUCKET, 'life-posts.json', data);
  return data;
}

/**
 * 上传图片
 * @param {Buffer} fileBuffer - 文件内容
 * @param {string} filename - 原始文件名
 * @param {string} contentType - MIME 类型
 * @returns {Promise<object>} 包含访问 URL
 */
async function upload(fileBuffer, filename, contentType) {
  const ext = path.extname(filename) || '.jpg';
  const uuid = crypto.randomUUID();
  const key = `images/${uuid}${ext}`;

  await cosClient.putObject(BUCKET, key, fileBuffer, contentType);

  // life 桶是私有桶，返回签名 URL
  const url = await cosClient.getSignedUrl(BUCKET, key);

  return {
    key,
    url,
    filename: `${uuid}${ext}`,
  };
}

module.exports = {
  list,
  update,
  upload,
};
