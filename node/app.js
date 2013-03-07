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
	token
}, {instanceMethods: {
	byToken: function(callback) {
		
	}
}});


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
	email: Sequelize.STRING,
	name: Sequelize.STRING,
	token: Sequelize.STRING,
	fbid: Sequelize.STRING
}, {instanceMethods: {
	stats: function(callback) {

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
	.hasMany(Play);
	.hasMany(Session);

Play.belongsTo(Level);
Play.belongsTo(User);

Session.belongsTo(User);

sequelize.sync();


// create our server
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({
	store: new MySQLSessionStore('cluckbutton', 'root', 'root', {
		sequelize: sequelize,
		session: Session
	}),
	secret: 'keyboard cat'
}));
app.use(app.router);

// home page
app.get('/', function(req, res) {
	res.writeHead(302, {
		'Location': 'http://cluckbutton.com'
	});
	res.end();
});

// signup page
app.get(['/signup/:id','/signup'], function(req, res) {
	res.render('signup',{
		plan: {name: req.params[0] || 'startup'},
		pageAccount: true,
		page: 'tour'
	});
});

// current user
app.get('/setup', function(req, res) {
	FB.setAccessToken(req.query.token);
	
	FB.api('/me', function(response) {
		res.send(JSON.stringify(response));
	});
//	User.find(1).success(function(user) {
		
//	});
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