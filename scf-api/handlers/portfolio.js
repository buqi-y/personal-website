'use strict';

const cosClient = require('../utils/cos-client');

const BUCKET = 'personal-site-portfolio';

/**
 * 获取作品集
 * @returns {Promise<object>}
 */
async function get() {
  const data = await cosClient.getObject(BUCKET, 'portfolio.json');
  return data || [];
}

/**
 * 更新作品集
 * @param {object} data - 作品集数据
 * @returns {Promise<object>}
 */
async function update(data) {
  await cosClient.putObject(BUCKET, 'portfolio.json', data);
  return data;
}

module.exports = {
  get,
  update,
};
