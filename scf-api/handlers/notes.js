'use strict';

const cosClient = require('../utils/cos-client');

const BUCKET = 'personal-site-notes';

/**
 * 获取笔记列表
 * @returns {Promise<object>}
 */
async function list() {
  const data = await cosClient.getObject(BUCKET, 'notes-list.json');
  return data || [];
}

/**
 * 获取单篇笔记
 * @param {string} slug - 笔记 slug
 * @returns {Promise<object>}
 */
async function get(slug) {
  const data = await cosClient.getObject(BUCKET, `notes/${slug}.json`);
  return data;
}

/**
 * 创建/更新笔记
 * @param {string} slug - 笔记 slug
 * @param {object} data - 笔记数据 { title, content, date, tags, slug }
 * @returns {Promise<object>}
 */
async function put(slug, data) {
  // 确保 slug 字段一致
  const noteData = { ...data, slug };

  // 上传笔记文件
  await cosClient.putObject(BUCKET, `notes/${slug}.json`, noteData);

  // 更新笔记列表
  const notesList = (await cosClient.getObject(BUCKET, 'notes-list.json')) || [];
  const existingIndex = notesList.findIndex((item) => item.slug === slug);

  const listItem = {
    title: noteData.title,
    slug: noteData.slug,
    date: noteData.date,
    tags: noteData.tags || [],
    description: noteData.description || '',
  };

  if (existingIndex >= 0) {
    notesList[existingIndex] = listItem;
  } else {
    notesList.unshift(listItem);
  }

  await cosClient.putObject(BUCKET, 'notes-list.json', notesList);

  return noteData;
}

/**
 * 删除笔记
 * @param {string} slug - 笔记 slug
 * @returns {Promise<void>}
 */
async function remove(slug) {
  // 删除笔记文件
  await cosClient.deleteObject(BUCKET, `notes/${slug}.json`);

  // 从列表中移除
  const notesList = (await cosClient.getObject(BUCKET, 'notes-list.json')) || [];
  const updatedList = notesList.filter((item) => item.slug !== slug);
  await cosClient.putObject(BUCKET, 'notes-list.json', updatedList);
}

module.exports = {
  list,
  get,
  put,
  remove,
};
