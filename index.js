var express = require('express');
var mysql = require('mysql');
var cors = require('cors')

//(!) Important After you defined database run db-migrate up to initialize initial tables then define adress of API IN Front End

// Database connect info
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'adidas13',
    database: 'mystore'
})
var app = express();
const port = 3000;
var fs = require('fs');
let users = [];
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

//Secret acces tokken
const accessTokenSecret = 'wired2beinthisyear';
const refreshTokenSecret = 'nice2have';
let refreshTokens = [];

//Miliseconds must be same in Front End
const expireTime = '10s';

//Define admin schema and roles
const adminRole = {
    user: 0,
    admin: 1
}
app.use('/uploads', express.static('uploads'));
app.use(cors());
app.use(bodyParser.json());
const mime = require('mime')
//uploader
var multer = require('multer')
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.' + mime.getExtension(file.mimetype))
    }
})
var upload = multer({ storage: storage })
//end uploader
//auth middleware
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, accessTokenSecret, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.idToken = user.id;
            req.role = user.role
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

//Auth
app.post('/login', (req, res) => {
    // Read username and password from request body
    const { username, password } = req.body;
    connection.query('SELECT * FROM user', (err, rows) => {
        if (err) {
            console.log('Error databse find users')
        }
        else {
            users = rows
        }
    })
    // Filter user from the users array by username and password
    const user = users.find(u => { return u.email === username && u.password === password });

    if (user) {
        // Generate an access token
        const accessToken = jwt.sign({ username: user.username, role: user.admin_role, id: user.id }, accessTokenSecret, { expiresIn: expireTime });
        const refreshToken = jwt.sign({ username: user.username, role: user.admin_role, id: user.id }, refreshTokenSecret);
        refreshTokens.push(refreshToken);
        res.json({
            accessToken,
            refreshToken
        });
    } else {
        return res.sendStatus(403);
    }
});

//Refresh new tokken acces.
app.post('/token', (req, res) => {
    console.log('Refresh token')
    const { token } = req.body;

    if (!token) {
        return res.sendStatus(401);
    }

    if (!refreshTokens.includes(token)) {
        return res.sendStatus(403);
    }

    jwt.verify(token, refreshTokenSecret, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }

        const accessToken = jwt.sign({ username: user.username, role: user.role, id: user.id }, accessTokenSecret, { expiresIn: expireTime });
        res.json({
            accessToken
        });
    });
});
app.post('/logout', (req, res) => {
    const { token } = req.body;
    refreshTokens = refreshTokens.filter(t => t !== token);
    return res.sendStatus(200);
});

//End auth

//Shop
// app.get('/shop/pg/:pg/rs/:rs', (req, res) => {
app.get('/shop', (req, res) => {
    // var itemsPerPage = req.params.rs
    // var offset = (req.params.pg - 1) * itemsPerPage;
    // console.log('offset' + offset)
    // console.log('limit' + itemsPerPage)
    connection.query(`SELECT
    t1.id as item_id,
    t1.date as date,
    t2.path as img,
    t1.price as price,
    t1.lastPrice as lastPrice,
    t1.name as name,
    t1.price as price, t1.lastPrice as lastPrice,
    t3.name as catName
    FROM items as t1 
    LEFT JOIN itemsphotos as t2 
     ON t1.id=t2.itemId 
    LEFT JOIN categoryes as t3
     ON t1.category_id=t3.id
     `
        //  LIMIT ${itemsPerPage} OFFSET ${offset}`
        , (err, rows) => {
            if (err) {
                res.sendStatus(403)
            } else {
                let products = {};
                rows.map((value, index) => {
                    if (products[value.item_id] === undefined) {
                        products[value.item_id] = { date: value.date, catName: value.catName, item_id: value.item_id, item_name: value.name, price: value.price, lastPrice: value.lastPrice, images: [] }
                        products[value.item_id].images.push(value.img)
                    } else {
                        products[value.item_id].images.push(value.img)
                    }
                })
                res.json({
                    description: 'Succes',
                    data: products
                })
            }
        })
})
app.get('/shop/cat/:id', (req, res) => {
    const id = req.params.id;
    connection.query(`SELECT
    t1.id as item_id,
    t2.path as img,
    t3.id as catId,
    t1.price as price,
    t1.lastPrice as lastPrice,
    t1.name as name,
    t1.price as price, t1.lastPrice as lastPrice,
    t3.name as catName
    FROM items as t1 
    LEFT JOIN itemsphotos as t2 
     ON t1.id=t2.itemId 
    LEFT JOIN categoryes as t3
     ON t1.category_id=t3.id
    WHERE t1.category_id=${id}`, (err, rows) => {
        if (err) {
            res.json({
                status: 'Error',
                description: err
            })
        } else {
            let products = {};
            rows.map((value, index) => {
                if (products[value.item_id] === undefined) {
                    products[value.item_id] = { catId: value.catId, catName: value.catName, item_id: value.item_id, item_name: value.name, price: value.price, lastPrice: value.lastPrice, images: [] }
                    products[value.item_id].images.push(value.img)
                } else {
                    products[value.item_id].images.push(value.img)
                }
            })
            res.json({
                status: "Succes",
                data: products
            })
        }
    })
})
app.post('/del-item/:id', authenticateJWT, (req, res, next) => {
    const id = req.params.id
    connection.query(`SELECT
                * FROM itemsphotos WHERE itemId=${id}`, (err, rows) => {
        rows.map(i => {
            fs.unlink(i.path, (err) => {
                if (err) throw err;
                console.log(i.path + " was deleted.")
            })
        })
        if (err) {
            console.log("itemsphotos table dosen't exist")
        }
    });
    if (req.role == adminRole.admin) {
        connection.query(`DELETE FROM items WHERE id=${id}`, (err, rows) => {
            if (err) {
                res.json({
                    status: 'Error',
                    description: err
                })
            } else {
                res.json({
                    status: 'Succes',
                    description: `The item with id ${id} was deleted`,
                    id: id
                })
            }
        })

    } else {
        return res.sendStatus(403)
    }
});
app.post('/del-cat/:id', authenticateJWT, (req, res, next) => {
    const id = req.params.id
    if (req.role == adminRole.admin) {
        connection.query(`SELECT * FROM categoryphotos WHERE catId=${id}`, (err, rows) => {
            rows.map(i => {
                fs.unlink(i.path, (err) => {
                    if (err) throw err;
                    console.log('Category with id ' + i.catId + " was deleted.")
                })
            })
            if (err) {
                console.log("category table dosen't exist")
            }
        })
        connection.query(`DELETE FROM categoryes WHERE id=${id}`, (err, rows) => {
            if (err) {
                res.json({
                    status: 'Error',
                    description: err
                })
            } else {
                res.json({
                    status: 'Succes',
                    description: `The category with id ${id} was deleted`,
                    id: id
                })
            }
        })
    } else {
        return res.sendStatus(403)
    }
});
app.get('/search/:item', (req, res, next) => {
    const { item } = req.params
    if (item.length = 0) {
        res.json({
            'data': []
        })
    } else {
        connection.query(`SELECT it.name, it.description, it.id, ph.path FROM items AS it LEFT JOIN itemsphotos AS ph ON it.id = ph.itemId WHERE it.name LIKE '%${item}%' GROUP BY it.name`, (err, rows) => {
            if (err) {
                res.json({
                    status: 'Error',
                    description: err
                })
            }
            res.json({
                'data': rows
            })
        })
    }
});
app.get('/search/', (req, res, next) => {
    res.json({
        'data': [],
        'description': 'This method is used for search items use search/something for search'
    })
});
app.post('/new-item', authenticateJWT, upload.array('itemPhoto', 12), (req, res, next) => {
    const files = req.files
    const { name, description, price, lastPrice, category_id } = req.body
    // Verify if any data is pass
    if (files.length > 0) {
        if (name.length > 0 && price >= 1 && category_id != undefined && category_id != '') {
            // Verify is admin 
            if (req.role == adminRole.admin) {
                if (!files) {
                    res.json({
                        status: 'Error',
                        code: '1',
                        description: 'Please select image for files.'
                    })
                } else {
                    connection.query(`SELECT * FROM categoryes WHERE id = ${category_id} `, (err, rows) => {
                        if (rows.length > 0) {

                            connection.query(`INSERT INTO items(name, description, price, lastPrice, category_id) VALUES('${name}', '${description}', ${price}, ${lastPrice}, ${category_id})`, (err, rows) => {
                                if (err) {
                                    res.json({
                                        status: 'Error',
                                        description: err
                                    })
                                } else {
                                    const idProduct = rows.insertId
                                    for (i = 0; i < files.length; i++) {
                                        const { originalname, filename, size, path, mimetype } = files[i]
                                        connection.query(`INSERT INTO itemsphotos(filename, size, path, originalName, mimetype, itemId) VALUES('${filename}', '${size}', 'uploads/${filename}', '${originalname}', '${mimetype}', ${idProduct})`, (err) => {
                                            if (err) {
                                                console.log(err)
                                            }
                                        })
                                    }
                                    res.json({
                                        status: 'Succes',
                                        description: 'New item was uploaded!',
                                        itemId: rows.insertId
                                    })
                                }
                            })
                        } else {
                            return res.json({
                                "status": "Error",
                                "description": "Select category or create new one"
                            })

                        }
                    })
                }
            } else {
                return res.sendStatus(403)
            }
        } else {
            return res.sendStatus(411)
        }
    } else {
        return res.json({
            status: 'Error',
            description: 'Plesae select an image for item.'
        })
    }
})
app.post('/new-category', authenticateJWT, upload.single('itemPhoto', 12), (req, res, next) => {
    const files = req.file
    const { name, description } = req.body
    // Verify if any data is pass 
    if (name.length > 0 && description.length > 0) {
        // Verify is admin 
        if (req.role == adminRole.admin) {
            if (!files) {
                res.json({
                    status: 'Error',
                    code: '1',
                    description: 'Please select image for category.'
                })
            } else {
                connection.query(`INSERT INTO categoryes(name, description) VALUES('${name}', '${description}')`, (err, rows) => {
                    if (err) {
                        res.json({
                            status: 'Error',
                            description: err
                        })
                    } else {
                        const catId = rows.insertId
                        const { originalname, filename, size, path, mimetype } = files
                        connection.query(`INSERT INTO categoryphotos(filename, size, path, originalName, mimetype, catId) VALUES('${filename}', '${size}', 'uploads/${filename}', '${originalname}', '${mimetype}', ${catId})`, (err) => {
                            if (err) {
                                console.log(err)
                            }
                        })
                        res.json({
                            status: 'Succes',
                            id: catId,
                            description: 'New category was created!'
                        })
                    }
                })
            }
        } else {
            return res.sendStatus(403)
        }
    } else {
        return res.sendStatus(411)
    }
})
app.put('/shop/:id', authenticateJWT, (req, res) => {
    const id = req.params.id
    const role = req.role
    const { name, description, lastPrice, price, category } = req.body
    // if is admin
    if (role === adminRole.admin) {
        connection.query(`UPDATE items SET name = '${name}', description = '${description}', price = ${price}, lastPrice = ${lastPrice}, category_id = ${category} WHERE id = ${id} `, (err) => {
            if (err) {
                console.log(err)
                res.json({
                    status: 'Error',
                    description: err
                })
            } else {
                res.status = 200;
                return res.json({
                    status: 'Succes',
                    description: 'Item was updated'
                })
            }
        })
    } else {
        return res.json({
            status: 'Error',
            description: 'Unauthorized'
        }).sendStatus(403)
    }
})

app.get('/category', (req, res) => {
    connection.query('SELECT * FROM categoryes LEFT JOIN categoryphotos ON categoryphotos.catId = categoryes.id ', (err, rows) => {
        if (!err) {
            res.json({
                status: 'Succes',
                data: rows
            })
        } else {
            res.json({
                status: 'Error',
                description: err
            })
        }
    })
})
app.put('/category', authenticateJWT, (req, res) => {
    const { name, description, id } = req.body
    const role = req.role
    if (role === adminRole.admin) {
        if (name.length > 6 && description.length > 8) {
            connection.query(`UPDATE categoryes SET name = '${name}', description = '${description}' WHERE id = ${id} `, (err) => {
                if (!err) {
                    res.sendStatus(200)
                } else {
                    res.json({
                        status: "Error",
                        description: err
                    })
                }
            })
        } else {
            res.json({
                status: "Error",
                description: "Name must be 6 chars and description greather then 8"
            })
        }
    } else {
        res.sendStatus(403)
    }
})
app.post('/category', authenticateJWT, (req, res) => {
    const role = req.role
    const { name, description } = req.body
    if (name.length >= 4 && description.length >= 8) {
        if (role === adminRole.admin) {
            connection.query(`INSERT INTO categoryes(name, description) VALUES('${name}', '${description}')`, (err) => {
                if (!err) {
                    res.sendStatus(200)
                } else {
                    res.json({
                        status: "Error",
                        description: err
                    })
                }
            })
        } else {
            res.json({
                status: "Error",
                description: "You need to be an admin for this."
            })
        }
    } else {
        res.json({
            status: "Error",
            description: "Name & Description must have at least 8 chars"
        })
    }
})
app.get('/category/:id', (req, res) => {
    const { id } = req.params
    connection.query('SELECT * FROM categoryes LEFT JOIN categoryphotos ON categoryphotos.catId = categoryes.id WHERE categoryes.id = ' + id, (err, rows) => {
        if (err) {
            res.json({
                status: 'Error',
                description: err
            })
        } else {
            res.json({
                data: rows
            })
        }
    })
})
app.get('/category/del/:id', (req, res) => {
    const { id } = req.params
    connection.query('SELECT * FROM categoryes WHERE id = ' + id, (err, rows) => {
        if (err) {
            res.sendStatus(403)
        } else {
            res.json({
                data: rows
            })
        }
    })
})
app.post('/upload/item-photos', authenticateJWT, upload.array('itemPhoto', 12), (req, res, next) => {
    const itemId = req.body.itemId
    const role = req.role
    const files = req.files
    // if is admin
    if (role === adminRole.admin) {
        if (!files) {
            error.httpStatusCode = 400
            const error = new Error('Please choose files')
            return next(error)
        }
        for (i = 0; i < files.length; i++) {
            const { originalname, filename, size, path, mimetype } = files[i]
            connection.query(`INSERT INTO itemsphotos(filename, size, path, originalName, mimetype, itemId) VALUES('${filename}', '${size}', 'uploads/${filename}', '${originalname}', '${mimetype}', ${itemId})`, (err) => {
                if (err) {
                    console.log(err)
                }
            })
        }
        res.send(files)
    } else {
        return res.sendStatus(403)
    }
})
app.post('/upload/category-photo', authenticateJWT, upload.single('itemPhoto'), (req, res, next) => {
    const catId = req.body.catId
    const role = req.role
    const files = req.file
    // if is admin
    if (role === adminRole.admin) {
        if (!files) {
            const error = new Error('Please choose files')
            error.httpStatusCode = 400
            return next(error)
        }

        const { originalname, filename, size, path, mimetype } = files
        connection.query(`INSERT INTO categoryphotos(filename, size, path, originalName, mimetype, catId) VALUES('${filename}', '${size}', 'uploads/${filename}', '${originalname}', '${mimetype}', ${catId})`, (err) => {
            if (err) {
                res.json({
                    status: 'Error',
                    description: err
                })
            }
        })

        res.send(files)
    } else {
        return res.sendStatus(403)
    }
})
app.get('/shop/:id', (req, res) => {
    const id = req.params.id
    connection.query(`SELECT
    t1.id as item_id,
        t1.description as description,
        t2.path as img,
        t1.price as price,
        t1.lastPrice as lastPrice,
        t1.name as name,
        t1.price as price, t1.lastPrice as lastPrice,
        t3.name as catName,
        t1.category_id as category_id
    FROM items as t1
    LEFT JOIN itemsphotos as t2
    ON t1.id = t2.itemId
    LEFT JOIN categoryes as t3
    ON t1.category_id = t3.id WHERE t1.id = ${id} `, (err, rows) => {
        if (err) {
            res.json({
                status: 'Error',
                description: err
            })
        } else {
            let products = {};
            rows.map((value, index) => {
                if (products[value.item_id] === undefined) {
                    products[value.item_id] = { catName: value.catName, catId: value.category_id, description: value.description, item_id: value.item_id, item_name: value.name, price: value.price, lastPrice: value.lastPrice, images: [] }
                    products[value.item_id].images.push(value.img)
                } else {
                    products[value.item_id].images.push(value.img)
                }
            })
            res.json({
                status: 'Succes',
                data: products
            })
        }
    })
})
//End shop

//User
app.get('/user/', authenticateJWT, function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    const id = req.idToken
    const idToken = req.idToken
    const role = req.role
    connection.query('SELECT id,username, email, admin_role FROM user WHERE id =' + id, (err, rows, fields) => {
        res.status(200).json({
            status: 'Succes',
            data: rows,
        })
    })
});
app.post('/signup', (req, res) => {
    const { username, password, email } = req.body
    // Filter user from the users array by username and password; Create new user
    if (username.length > 0 && password.length >= 6 && email.length > 0) {
        /// Check if is allready user with this email
        connection.query('SELECT * FROM user', (err, rows) => {
            if (err) {
                console.log('Error databse find users')
            }
            else {
                const user = rows.find(u => {
                    return u.email === email
                });
                if (user) {
                    res.json({
                        status: 'Error',
                        description: 'Allready exist on this email'
                    })
                } else {
                    connection.query(`INSERT INTO user(username, email, password) VALUES('${username}', '${email}', '${password}')`, (err, rows) => {
                        if (err) {
                            console.log(err)
                            return res.sendStatus(403)
                        } else {
                            let id = rows.insertId
                            connection.query('SELECT username FROM user WHERE id =' + id, (err, rows) => {
                                if (err) {
                                    res.json({
                                        status: "Error",
                                        description: "Unexpected error"
                                    })
                                }
                                res.json({
                                    status: "Succes",
                                    data: rows[0]
                                })
                            })
                        }
                    })
                }
            }
        })

    } else {
        res.sendStatus(411)
    }
})
//End user
app.listen(port, () => console.log("Node started to port: " + port))