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
  db.createTable('categoryes', {
    id: {
      type: 'int',
      primaryKey: true,
      unsigned: true,
      notNull: true,
      autoIncrement: true,
    },
    name: {
      type: 'text',
    },
    description: {
      type: 'text',
    },
    date: {
      type: "timestamp", notNull: "true", defaultValue: new String('now()')
    },
  }, function (err) {
    if (err) return callback(err);
    return callback();
  })
};
exports.down = function (db) {
  db.dropTable('categoryes', callback);
};

exports._meta = {
  "version": 1
};
