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
  db.createTable('user', {
    id: {
      type: 'int',
      primaryKey: true,
      unsigned: true,
      notNull: true,
      autoIncrement: true,
    },
    username: {
      type: 'string',
    },
    email: {
      type: 'string',
    },
    admin_role: {
      type: 'int',
      defaultValue: 0,
    },
    password: {
      type: 'string',
    },
    date: {
      type: "timestamp", notNull: "true", defaultValue: new String('now()')
    },
    country: {
      type: 'string',
    },
    state: {
      type: 'string',
    },
    address: {
      type: 'string',
    },
    phone: {
      type: 'string',
    },
  }, function (err) {
    if (err) return callback(err);
    return callback();
  });
};
exports.down = function (db) {
  return db.dropTable('user');
};
exports._meta = {
  "version": 1
};
