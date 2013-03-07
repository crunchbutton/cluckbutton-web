var
	express = require('express'),
	Sequelize = require('sequelize'),
	FB = require('fb'),
	app = express(),
	MySQLSessionStore = require('connect-mysql-session')(express);

// database connectivity
var sequelize = new Sequelize('cluckbutton', 'root', 'root', {
	host: 'localhost',
	port: '/Applications/MAMP/tmp/mysql/mysql.sock', // need to switch based on env
	logging: false,
	maxConcurrentQueries: 100,
	dialect: 'mysql',
	omitNull: true,
	define: {
		charset: 'utf8',
		collate: 'utf8_general_ci',
		timestamps: true
	},
	pool: { maxConnections: 5, maxIdleTime: 30}
});



var Session = sequelize.define('Session', {
	sid: {type: Sequelize.STRING, unique: true, allowNull: false},
	expires: Sequelize.INTEGER,
	json: Sequelize.TEXT,
	token: Sequelize.TEXT
});

var Play = sequelize.define('Played', {
	start: Sequelize.DATE,
	end: Sequelize.DATE,
	jumps: Sequelize.INTEGER,
	elapsed: Sequelize.INTEGER,
	collected: Sequelize.INTEGER,
	killed: Sequelize.INTEGER,
	falls: Sequelize.INTEGER,
	injury: Sequelize.INTEGER,
	score: Sequelize.INTEGER
});

var User = sequelize.define('User', {
	uid: {type: Sequelize.STRING, unique: true, allowNull: false},
	email: Sequelize.STRING,
	name: Sequelize.STRING,
	fbid: Sequelize.STRING,
	gender: Sequelize.STRING,
	timezone: Sequelize.STRING,
	locale: Sequelize.STRING,
	location: Sequelize.STRING
}, {instanceMethods: {
	by: function(callback) {

	}
}});

var Level = sequelize.define('Level', {
	name: Sequelize.STRING,
	map: Sequelize.STRING,
	maxScore: Sequelize.INTEGER,
	maxJumps: Sequelize.INTEGER,
	airJump: Sequelize.BOOLEAN,
	friction_x: Sequelize.FLOAT,
	friction_y: Sequelize.FLOAT,
	gravity: Sequelize.FLOAT
});


// set up associations
Level
	.hasMany(Play);

User
	.hasMany(Play)
	.hasMany(Session);

Play.belongsTo(Level);
Play.belongsTo(User);

Session.belongsTo(User);

sequelize.sync();


// create our server
app.use(express.cookieParser());
app.use(express.session({
	store: new MySQLSessionStore({
		sequelize: sequelize,
		session: Session
	}),
	secret: 'bacon mutation'
}));
app.use(express.bodyParser());
app.use(app.router);

// home page
app.get('/', function(req, res) {
	res.writeHead(302, {
		'Location': 'http://cluckbutton.com'
	});
	res.end();
});

// startlevel
app.get('/level/start', function(req, res) {
	if (req.session.UserId) {
		User.find(req.session.UserId).success(function(user) {
			if (user) {
				Level.find(req.query.level).success(function(level) {
					if (level) {
						Play.build({
							UserId: user.id,
							LevelId: req.query.level,
							start: new Date
						}).save().success(function(play) {
							res.write(JSON.stringify(play));
							res.end();
						});
					} else {
						res.writeHead(404);
						res.end();
					}
				});
			} else {
				res.writeHead(401);
				res.end();
			}
		});
	} else {
		res.writeHead(401);
		res.end();
	}
});

// endlevel
app.get('/level/end', function(req, res) {
	if (req.session.UserId) {
		User.find(req.session.UserId).success(function(user) {
			if (user) {
				Play.find(req.query.play).success(function(play) {
					if (play) {
						play.end = new Date;
						play.score = req.query.score;
						play.save();
					} else {
						res.writeHead(404);
						res.end();
					}
				});
			} else {
				res.writeHead(401);
				res.end();
			}
		});
	} else {
		res.writeHead(401);
		res.end();
	}
});


// setup config
app.get('/setup', function(req, res) {
	var error = function(er) {
		res.send(JSON.stringify({error: er}));
	};

	var success = function(response) {
		if (!req.session.UserId) {
			req.session.UserId = response.id;
		}
		res.send(JSON.stringify(response));
	};

	if (req.session.UserId) {
		// get the user by our session
		User.find(req.session.UserId).success(function(user) {
			success(user);
		});

	} else if (req.query.token) {
		// get the user by the facebook token
		req.session.token = req.query.token;
		var newFB = require('fb');
		newFB.options({accessToken: req.query.token});

		newFB.api('/me', function(response) {
			if (response.error) {
				if (response.error.code == 190) {
					error('session expired');
				} else {
					error('could not find user from auth token');
				}

			} else {
				User.find({where: {fbid: response.id}}).success(function(user) {
					if (user) {
						success(user);
					} else {
						// no user in the db. make one!
						var user = User.build({
							fbid: response.id,
							name: response.name,
							gender: response.gender,
							timezone: response.timezone,
							locale: response.locale,
							email: response.email,
							location: response.location[0] ? response.location[0].name : '',
						});
						user.save();
						success(user);
					}
				});
			}
		});

	} else {
		error('no valid session logic');
	}
});

// reset everthing and add test data
app.get('/reset', function(req, res) {
	// debug data
	sequelize.sync({force: true}).success(function() {
		Level.build({
			name: 'area01'
		}).save();		
	});

	res.send('all reset!');
});


app.listen(3002);
//app.use(express.static(__dirname + '/public'));


/*
var clients = [];
var clearDC = function() {
	for (x in clients) {
		if (clients[x].socket.disconnected) {			
			clients.splice(x, 1);
		}
	}
}



var io = require('socket.io').listen(3001);
io.sockets.on('connection', function (socket) {
	clients[clients.length] = socket;
	
	socket.emit('connected', { 
		test: 'asd'
	});

	socket.on('message.config', function (data) {
		// send back the config data
		
	});
});
*/