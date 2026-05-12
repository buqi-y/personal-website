'use strict';

const cosClient = require('../utils/cos-client');

const BUCKET = 'personal-site-settings';

// 设置文件映射
const SETTINGS_FILES = {
  siteSettings: 'site-settings.json',
  cardLayout: 'card-layout.json',
  theme: 'theme.json',
  essays: 'essays.json',
  profile: 'profile.json',
};

/**
 * 获取所有设置（合并返回）
 * @returns {Promise<object>}
 */
async function get() {
  const results = {};

  // 并发读取所有设置文件
  const entries = Object.entries(SETTINGS_FILES);
  const promises = entries.map(async ([key, filename]) => {
    const data = await cosClient.getObject(BUCKET, filename);
    return [key, data];
  });

  const settingsArray = await Promise.all(promises);

  for (const [key, data] of settingsArray) {
    if (data !== null) {
      results[key] = data;
    }
  }

  return results;
}

/**
 * 更新设置（根据字段分别更新对应文件）
 * @param {object} data - 设置数据
 * @returns {Promise<object>}
 */
async function update(data) {
  const promises = [];

  for (const [key, filename] of Object.entries(SETTINGS_FILES)) {
    if (data[key] !== undefined) {
      promises.push(cosClient.putObject(BUCKET, filename, data[key]));
    }
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  }

  return data;
}

module.exports = {
  get,
  update,
};
