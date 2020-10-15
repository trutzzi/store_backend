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
  db.createTable('categoryphotos', {
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
    catId: {
      unsigned: true,
      notNull: true,
      type: 'int',
    },
    path: {
      type: 'string',
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
  }).then(
    () => {
      db.addForeignKey('categoryphotos', 'categoryes', 'photo_cat',
        {
          'catId': 'id'
        },
        {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        }, callback);
    }
  )
};
exports.down = function (db, callback) {
  db.dropTable('categoryphotos', callback);
};

exports._meta = {
  "version": 1
};
