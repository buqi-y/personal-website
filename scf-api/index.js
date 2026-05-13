'use strict';

const Busboy = require('busboy');
const { verifyAuth } = require('./utils/auth');
const notesHandler = require('./handlers/notes');
const lifeHandler = require('./handlers/life');
const bookmarksHandler = require('./handlers/bookmarks');
const portfolioHandler = require('./handlers/portfolio');
const musicHandler = require('./handlers/music');
const mediaHandler = require('./handlers/media');
const settingsHandler = require('./handlers/settings');

// CORS 头
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

/**
 * 构建成功响应
 */
function success(data) {
  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ code: 0, data }),
  };
}

/**
 * 构建错误响应
 */
function error(message, statusCode = 400) {
  return {
    isBase64Encoded: false,
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ code: -1, message }),
  };
}

/**
 * 解析 multipart/form-data（使用 busboy 进行二进制安全解析）
 * @param {Buffer} bodyBuffer - 请求体 Buffer
 * @param {string} contentType - 完整的 Content-Type 头
 * @returns {Promise<object>} { file: { buffer, filename, contentType }, fields: {} }
 */
function parseMultipart(bodyBuffer, contentType) {
  return new Promise((resolve, reject) => {
    const result = { file: null, fields: {} };
    const bb = Busboy({ headers: { 'content-type': contentType } });

    bb.on('file', (fieldname, file, info) => {
      const chunks = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('end', () => {
        result.file = {
          buffer: Buffer.concat(chunks),
          filename: info.filename,
          contentType: info.mimeType,
        };
      });
    });

    bb.on('field', (fieldname, value) => {
      result.fields[fieldname] = value;
    });

    bb.on('finish', () => resolve(result));
    bb.on('error', reject);

    bb.write(bodyBuffer);
    bb.end();
  });
}

/**
 * 从 event 中获取请求体 Buffer
 */
function getBodyBuffer(event) {
  if (!event.body) return null;
  if (event.isBase64Encoded) {
    return Buffer.from(event.body, 'base64');
  }
  return Buffer.from(event.body, 'utf-8');
}

/**
 * 解析 JSON body
 */
function parseJsonBody(event) {
  try {
    if (!event.body) return {};
    const bodyStr = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf-8')
      : event.body;
    return JSON.parse(bodyStr);
  } catch (e) {
    return {};
  }
}

/**
 * SCF 主入口函数
 */
exports.main_handler = async (event, context) => {
  const method = (event.httpMethod || event.requestContext?.httpMethod || 'GET').toUpperCase();
  let path = event.path || event.requestContext?.path || event.url || '/';
  const headers = event.headers || {};

  // 函数 URL 可能将 query string 附加在 path 中，需要移除
  if (path.includes('?')) {
    path = path.split('?')[0];
  }
  // 移除末尾斜杠
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  // 处理 OPTIONS 预检请求
  if (method === 'OPTIONS') {
    return {
      isBase64Encoded: false,
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  // 调试路由：访问根路径返回事件信息
  if (path === '/' && method === 'GET') {
    return {
      isBase64Encoded: false,
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        code: 0,
        data: {
          message: 'Personal Site API is running',
          receivedPath: event.path,
          requestContextPath: event.requestContext?.path,
          url: event.url,
          resolvedPath: path,
          method: method,
          eventKeys: Object.keys(event),
        },
      }),
    };
  }

  try {
    // 写操作需要鉴权（POST, PUT, DELETE）
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      if (!verifyAuth(headers)) {
        return error('Unauthorized', 401);
      }
    }

    // 路由分发
    return await routeRequest(method, path, event, headers);
  } catch (err) {
    console.error('Handler error:', err);
    return error(err.message || 'Internal Server Error', 500);
  }
};

/**
 * 路由分发
 */
async function routeRequest(method, reqPath, event, headers) {
  // 移除路径前缀 /api
  const apiPath = reqPath.replace(/^\/api/, '') || '/';

  // Notes 路由
  if (apiPath === '/notes' && method === 'GET') {
    const data = await notesHandler.list();
    return success(data);
  }

  if (apiPath.match(/^\/notes\/[^/]+$/) && method === 'GET') {
    const slug = apiPath.split('/')[2];
    const data = await notesHandler.get(slug);
    if (!data) return error('Note not found', 404);
    return success(data);
  }

  if (apiPath.match(/^\/notes\/[^/]+$/) && method === 'PUT') {
    const slug = apiPath.split('/')[2];
    const body = parseJsonBody(event);
    const data = await notesHandler.put(slug, body);
    return success(data);
  }

  if (apiPath.match(/^\/notes\/[^/]+$/) && method === 'DELETE') {
    const slug = apiPath.split('/')[2];
    await notesHandler.remove(slug);
    return success(null);
  }

  // Life 路由
  if (apiPath === '/life' && method === 'GET') {
    const data = await lifeHandler.list();
    return success(data);
  }

  if (apiPath === '/life' && method === 'PUT') {
    const body = parseJsonBody(event);
    const data = await lifeHandler.update(body);
    return success(data);
  }

  if (apiPath === '/life/upload' && method === 'POST') {
    const contentType = headers['content-type'] || headers['Content-Type'] || '';
    if (!contentType.includes('multipart/form-data')) return error('Missing multipart boundary');

    const bodyBuffer = getBodyBuffer(event);
    if (!bodyBuffer) return error('Empty request body');

    const parsed = await parseMultipart(bodyBuffer, contentType);
    if (!parsed.file) return error('No file found in request');

    const data = await lifeHandler.upload(
      parsed.file.buffer,
      parsed.file.filename,
      parsed.file.contentType
    );
    return success(data);
  }

  // Life 图片代理路由（解决 CORS 和 COS 2024 下载限制）
  if (apiPath.match(/^\/life\/image\/.+/) && method === 'GET') {
    const key = decodeURIComponent(apiPath.replace(/^\/life\/image\//, ''));
    try {
      const { buffer, contentType } = await lifeHandler.getImage(key);
      return {
        isBase64Encoded: true,
        statusCode: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
        body: buffer.toString('base64'),
      };
    } catch (err) {
      if (err.statusCode === 404 || err.code === 'NoSuchKey') {
        return error('Image not found', 404);
      }
      throw err;
    }
  }

  // Bookmarks 路由
  if (apiPath === '/bookmarks' && method === 'GET') {
    const data = await bookmarksHandler.get();
    return success(data);
  }

  if (apiPath === '/bookmarks' && method === 'PUT') {
    const body = parseJsonBody(event);
    const data = await bookmarksHandler.update(body);
    return success(data);
  }

  // Portfolio 路由
  if (apiPath === '/portfolio' && method === 'GET') {
    const data = await portfolioHandler.get();
    return success(data);
  }

  if (apiPath === '/portfolio' && method === 'PUT') {
    const body = parseJsonBody(event);
    const data = await portfolioHandler.update(body);
    return success(data);
  }

  // Music 路由
  if (apiPath === '/music' && method === 'GET') {
    const data = await musicHandler.get();
    return success(data);
  }

  if (apiPath === '/music' && method === 'PUT') {
    const body = parseJsonBody(event);
    const data = await musicHandler.update(body);
    return success(data);
  }

  // Media 路由
  if (apiPath === '/media/upload' && method === 'POST') {
    const contentType = headers['content-type'] || headers['Content-Type'] || '';
    if (!contentType.includes('multipart/form-data')) return error('Missing multipart boundary');

    const bodyBuffer = getBodyBuffer(event);
    if (!bodyBuffer) return error('Empty request body');

    const parsed = await parseMultipart(bodyBuffer, contentType);
    if (!parsed.file) return error('No file found in request');

    const folder = parsed.fields.folder || 'wallpapers';
    const data = await mediaHandler.upload(
      parsed.file.buffer,
      parsed.file.filename,
      parsed.file.contentType,
      folder
    );
    return success(data);
  }

  if (apiPath.match(/^\/media\/[^/]+/) && method === 'DELETE') {
    // key 是 /media/ 后面的完整路径
    const key = decodeURIComponent(apiPath.replace(/^\/media\//, ''));
    await mediaHandler.remove(key);
    return success(null);
  }

  // Settings 路由
  if (apiPath === '/settings' && method === 'GET') {
    const data = await settingsHandler.get();
    return success(data);
  }

  if (apiPath === '/settings' && method === 'PUT') {
    const body = parseJsonBody(event);
    const data = await settingsHandler.update(body);
    return success(data);
  }

  // 404
  return error('Not Found', 404);
}
