'use strict';

const cosClient = require('../utils/cos-client');

const BUCKET = 'personal-site-music';

/**
 * 获取音乐配置
 * @returns {Promise<object>}
 */
async function get() {
  const data = await cosClient.getObject(BUCKET, 'config.json');
  return data || { playlistId: '', playMode: 'loop', volume: 50 };
}

/**
 * 更新音乐配置
 * @param {object} data - 配置数据 { playlistId, playMode, volume }
 * @returns {Promise<object>}
 */
async function update(data) {
  await cosClient.putObject(BUCKET, 'config.json', data);
  return data;
}

module.exports = {
  get,
  update,
};
