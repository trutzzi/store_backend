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
  db.createTable('items', {
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
      type: 'text'
    },
    price: {
      type: 'int',
      length: 6
    },
    date: {
      type: "timestamp", notNull: "true", defaultValue: new String('now()')
    },
    lastPrice: {
      type: 'int',
      length: 6
    },
    category_id: {
      type: 'int',
      unsigned: true,
      length: 10,
      notNull: true,
      foreignKey: {
        name: 'items_category_id_fk',
        table: 'categoryes',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        },
        mapping: {
          category_id: 'id'
        }
      }
    },
  }, function (err) {
    if (err) return callback(err);
    return callback();
  }).then(
    () => {
      db.addForeignKey('itemsphotos', 'items', 'item_key',
        {
          'itemId': 'id'
        },
        {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        }, callback);
    }
  );
};

exports.down = function (db) {
  return db.dropTable('items');
};

exports._meta = {
  "version": 1
};
