const Koa = require('koa');
const koaRouter = require('koa-better-router');
const body = require('koa-better-body');
const cors = require('koa-cors');
const DBManager = require('./db');

const router = koaRouter().loadMethods();
const app = new Koa();
const dbName = 'like-it';
const db = new DBManager('mongodb://127.0.0.1:27017');

const getResponseJson = (err, data, message) => {
  if (err) {
    if (typeof err === 'string') {
      return {
        status: 0,
        message: err,
      };
    }
    return {
      status: 0,
      message: err.message,
    };
  }

  let count;
  if (Array.isArray(data)) {
    count = data.length;
  }

  return {
    status: 1,
    message: message || 'success',
    data,
    count,
  };
};

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    logger.error(err);

    ctx.body = {
      message: process.env.NODE_ENV === 'dev'
        ? err.message : '系统闹了一点小情绪，请稍候重试',
    };
    ctx.status = err.status || 500;
  }
});

router.post('/topic/add', body(), async (ctx, next) => {
  try {
    const postData = ctx.request.fields;
    if (!postData.name) {
      throw new Error('参数错误');
    }

    await db.addTopic(postData);
    ctx.body = getResponseJson(null, await db.getTopicList(),'操作成功');
  } catch (err) {
    ctx.body = getResponseJson(err);
  }

  next();
});

router.post('/topic/like', body(), async (ctx, next) => {
  try {
    const postData = ctx.request.fields;
    if (!postData._id) {
      throw new Error('参数错误');
    }

    await db.likeTopic(postData);
    ctx.body = getResponseJson(null, await db.getTopicList(), '操作成功');
  } catch (err) {
    ctx.body = getResponseJson(err);
  }

  next();
});

router.post('/topic/getTopicList', body(), async (ctx, next) => {
  try {
    const result = await db.getTopicList();
    ctx.body = getResponseJson(null, result, '获取成功');
  } catch (err) {
    ctx.body = getResponseJson(err);
  }

  next();
});

const api = koaRouter({ prefix: '/api' });
api.extend(router);

db.open(dbName)
  .then((client) => {
    const server = app
      .use(api.middleware())
      .use(cors())
      .use(router.middleware())
      .listen(3456);

    process.on('SIGINT', () => {
      client.close();
      server.close();
    });
  });
