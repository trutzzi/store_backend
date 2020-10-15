'use strict';

var dbm;
var type;
var seed;
/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  db.createTable('itemsphotos', {
    id: {
      type: 'int',
      primaryKey: true,
      unsigned: true,
      notNull: true,
      autoIncrement: true,
    },
    filename: {
      type: 'string',
    },
    mimetype: {
      type: 'string',
    },
    itemId: {
      type: 'int',
      unsigned: true,
      notNull: true,
      length: 10
    },
    path: {
      type: 'string',
      notNull: true,
    },
    size: {
      type: 'int'
    },
    originalName: {
      type: 'string',
    },
  }, function (err) {
    if (err) return callback(err);
    return callback();
  });
};
exports.down = function (db, callback) {
  db.dropTable('itemsphotos', callback);
};

exports._meta = {
  "version": 1
};
