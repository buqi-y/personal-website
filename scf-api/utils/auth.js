'use strict';

/**
 * 验证请求鉴权
 * @param {object} headers - 请求头对象
 * @returns {boolean} 鉴权是否通过
 */
function verifyAuth(headers) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // 未配置 API_KEY 时跳过鉴权
    return true;
  }

  // 从 headers 中获取 x-api-key（兼容大小写）
  const requestKey =
    headers['x-api-key'] ||
    headers['X-Api-Key'] ||
    headers['X-API-KEY'] ||
    '';

  return requestKey === apiKey;
}

module.exports = {
  verifyAuth,
};
