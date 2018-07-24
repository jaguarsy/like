const mongodb = require('mongodb');

const mongoClient = mongodb.MongoClient;

const getCollection = (db, name) => new Promise((resolve, reject) => {
  if (db.collection(name)) {
    resolve(db.collection(name));
    return;
  }

  db.createCollection(name, (err, collection) => {
    if (err) {
      reject(err);
    } else {
      resolve(collection);
    }
  });
});


class DBManager {
  constructor(url) {
    this.url = url;
  }

  open(dbName) {
    return new Promise((resolve, reject) => {
      mongoClient.connect(this.url, async (err, client) => {
        if (err) {
          reject(err);
          return;
        }

        const db = client.db(dbName);
        this.topics = await getCollection(db, 'topics');
        resolve(client);
      });
    });
  }

  addTopic({ name }) {
    return new Promise((resolve, reject) => {
      this.topics.insertOne({
        name,
        count: 0,
        createTime: new Date(),
      }, (err, doc) => {
        if (err) {
          reject(err);
        } else {
          resolve(doc);
        }
      });
    });
  }

  likeTopic({ _id }) {
    return new Promise((resolve) => {
      this.topics.updateOne({
        _id: new mongodb.ObjectID(_id),
      }, {
        $inc: {
          count: 1,
        },
      }, (err, doc) => {
        if (err) {
          resolve(false);
        } else {
          resolve(doc.result.nModified && doc.result.ok);
        }
      });
    });
  }

  getTopicList() {
    return new Promise((resolve, reject) => {
      this.topics
        .find()
        .sort({ count: -1, createTime: -1 })
        .toArray((err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc);
          }
        });
    });
  }
}

module.exports = DBManager;
