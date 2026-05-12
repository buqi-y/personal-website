'use strict';

const COS = require('cos-nodejs-sdk-v5');

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
});

const Region = process.env.COS_REGION || 'ap-shanghai';
const AppId = process.env.COS_APPID;

/**
 * 获取完整的桶名称
 * @param {string} bucketPrefix - 桶名前缀，如 personal-site-notes
 * @returns {string} 完整桶名，如 personal-site-notes-1234567890
 */
function getBucketName(bucketPrefix) {
  return `${bucketPrefix}-${AppId}`;
}

/**
 * 获取 COS 对象
 * @param {string} bucket - 桶名前缀
 * @param {string} key - 对象键
 * @returns {Promise<any>} 解析后的 JSON 对象或 Buffer
 */
async function getObject(bucket, key) {
  try {
    const result = await cos.getObject({
      Bucket: getBucketName(bucket),
      Region,
      Key: key,
    });
    const body = result.Body;
    // 尝试解析为 JSON
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch (e) {
        return body;
      }
    }
    // Buffer 类型，尝试解析为 JSON
    if (Buffer.isBuffer(body)) {
      const str = body.toString('utf-8');
      try {
        return JSON.parse(str);
      } catch (e) {
        return body;
      }
    }
    return body;
  } catch (err) {
    // 对象不存在时返回 null（不报错）
    if (err.statusCode === 404 || err.code === 'NoSuchKey') {
      return null;
    }
    throw err;
  }
}

/**
 * 上传对象到 COS
 * @param {string} bucket - 桶名前缀
 * @param {string} key - 对象键
 * @param {string|Buffer} body - 上传内容
 * @param {string} [contentType] - Content-Type
 * @returns {Promise<object>}
 */
async function putObject(bucket, key, body, contentType) {
  const params = {
    Bucket: getBucketName(bucket),
    Region,
    Key: key,
    Body: typeof body === 'object' && !Buffer.isBuffer(body) ? JSON.stringify(body) : body,
  };
  if (contentType) {
    params.ContentType = contentType;
  } else if (typeof body === 'string' || (typeof body === 'object' && !Buffer.isBuffer(body))) {
    params.ContentType = 'application/json; charset=utf-8';
  }
  return await cos.putObject(params);
}

/**
 * 删除 COS 对象
 * @param {string} bucket - 桶名前缀
 * @param {string} key - 对象键
 * @returns {Promise<object>}
 */
async function deleteObject(bucket, key) {
  return await cos.deleteObject({
    Bucket: getBucketName(bucket),
    Region,
    Key: key,
  });
}

/**
 * 获取临时签名 URL（用于私有桶文件访问）
 * @param {string} bucket - 桶名前缀
 * @param {string} key - 对象键
 * @param {number} [expires=3600] - 有效期（秒）
 * @returns {Promise<string>}
 */
async function getSignedUrl(bucket, key, expires = 3600) {
  return new Promise((resolve, reject) => {
    cos.getObjectUrl(
      {
        Bucket: getBucketName(bucket),
        Region,
        Key: key,
        Sign: true,
        Expires: expires,
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.Url);
        }
      }
    );
  });
}

/**
 * 获取公开访问 URL（用于公有读桶）
 * @param {string} bucket - 桶名前缀
 * @param {string} key - 对象键
 * @returns {string}
 */
function getPublicUrl(bucket, key) {
  return `https://${getBucketName(bucket)}.cos.${Region}.myqcloud.com/${key}`;
}

module.exports = {
  getObject,
  putObject,
  deleteObject,
  getSignedUrl,
  getPublicUrl,
  getBucketName,
};
