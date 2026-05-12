'use strict';

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
 * 解析 multipart/form-data
 * @param {Buffer} bodyBuffer - 请求体 Buffer
 * @param {string} boundary - boundary 字符串
 * @returns {object} { file: { buffer, filename, contentType }, fields: {} }
 */
function parseMultipart(bodyBuffer, boundary) {
  const result = { file: null, fields: {} };
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = [];

  let start = 0;
  while (true) {
    const idx = bodyBuffer.indexOf(boundaryBuffer, start);
    if (idx === -1) break;
    if (start > 0) {
      // 去掉前面的 \r\n 和后面的 \r\n
      let partEnd = idx - 2; // 去掉 \r\n
      if (partEnd > start) {
        parts.push(bodyBuffer.slice(start, partEnd));
      }
    }
    start = idx + boundaryBuffer.length + 2; // 跳过 boundary + \r\n
  }

  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const headerStr = part.slice(0, headerEnd).toString('utf-8');
    const body = part.slice(headerEnd + 4);

    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    const contentTypeMatch = headerStr.match(/Content-Type:\s*(.+)/i);

    if (filenameMatch) {
      result.file = {
        buffer: body,
        filename: filenameMatch[1],
        contentType: contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream',
      };
    } else if (nameMatch) {
      result.fields[nameMatch[1]] = body.toString('utf-8').trim();
    }
  }

  return result;
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
 * 从 Content-Type 头中提取 boundary
 */
function getBoundary(contentType) {
  if (!contentType) return null;
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^\s;]+))/i);
  return match ? match[1] || match[2] : null;
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
    const boundary = getBoundary(contentType);
    if (!boundary) return error('Missing multipart boundary');

    const bodyBuffer = getBodyBuffer(event);
    if (!bodyBuffer) return error('Empty request body');

    const parsed = parseMultipart(bodyBuffer, boundary);
    if (!parsed.file) return error('No file found in request');

    const data = await lifeHandler.upload(
      parsed.file.buffer,
      parsed.file.filename,
      parsed.file.contentType
    );
    return success(data);
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
    const boundary = getBoundary(contentType);
    if (!boundary) return error('Missing multipart boundary');

    const bodyBuffer = getBodyBuffer(event);
    if (!bodyBuffer) return error('Empty request body');

    const parsed = parseMultipart(bodyBuffer, boundary);
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
