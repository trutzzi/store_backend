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
  return db.createTable('orderItem', {
    id: {
      type: 'int',
      primaryKey: true,
      unsigned: true,
      notNull: true,
      autoIncrement: true,
    },
    orderId: { type: 'int' },
    productId: { type: 'int' },
    quantity: { type: 'int' }

  }, function (err) {
    if (err) return callback(err);
    return callback();
  }).then(
    () => {
      db.addForeignKey('orderItem', 'items', 'id',
        {
          'productId': 'id'
        },
        {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        }, callback);
      db.addForeignKey('orderItem', 'orders', 'id',
        {
          'orderId': 'id'
        },
        {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        }, callback);
    }
  );
};

exports.down = function (db) {
  return db.dropTable('orderItem');
};

exports._meta = {
  "version": 1
};
