'use strict';

const cosClient = require('../utils/cos-client');

const BUCKET = 'personal-site-bookmarks';

/**
 * 获取书签列表
 * @returns {Promise<object>}
 */
async function get() {
  const data = await cosClient.getObject(BUCKET, 'bookmarks.json');
  return data || [];
}

/**
 * 更新书签
 * @param {object} data - 书签数据
 * @returns {Promise<object>}
 */
async function update(data) {
  await cosClient.putObject(BUCKET, 'bookmarks.json', data);
  return data;
}

module.exports = {
  get,
  update,
};
