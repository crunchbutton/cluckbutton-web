var
	express = require('express'),
	Sequelize = require('sequelize'),
	FB = require('fb');

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
//	sync: { force: true },
//	syncOnAssociation: true,
	pool: { maxConnections: 5, maxIdleTime: 30}
});

/*
var ProjectPhone = sequelize.define('ProjectPhone', {
	number: Sequelize.STRING
}, {instanceMethods: {
	project: function(callback) {
		Project.find({where: {id: this.ProjectId}})
			.success(callback)
			.error(function() {
				callback(false);
			});
	}
}});
*/

var User = sequelize.define('User', {
	email: Sequelize.STRING,
	name: Sequelize.STRING,
	token: Sequelize.STRING,
	fbid: Sequelize.STRING
});

var Level = sequelize.define('Level', {
	name: Sequelize.STRING,
	map: Sequelize.STRING,
	maxScore: Sequelize.INTEGER,
	maxJumps: Sequelize.INTEGER,
	airJump: Sequelize.BOOL,
	friction_x: Sequelize.FLOAT,
	friction_y: Sequelize.FLOAT,
	gravity: Sequelize.FLOAT
});


// set up associations
Level
	.hasMany(User)
	.hasMany(Played);
/*
Played
	.hasMany(Project)
	.hasMany(User);
*/
	
User
	.hasMany(Played);


Played.belongsTo(Level);
Played.belongsTo(User);

sequelize.sync();


// create our server
var app = express.createServer();
app.use(express.bodyParser());
app.use(passport.initialize());
app.use(app.router);

// home page
app.get('/', function(req, res) {
	res.send('nothing to see here');
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
app.get('/api/user', function(req, res) {
	User.find(1).success(function(user) {
		res.send(JSON.stringify(user));
	});
});

// reset everthing and add test data
app.get('/reset', function(req, res) {
	// debug data
	sequelize.sync({force: true}).success(function() {
		Project.build({
			title: 'Crunchbutton',
			name: 'crunchbutton'
		}).save().success(function(project) {
			ProjectPhone.build({
				number: '13107733622'
			}).save().success(function(projectPhone) {
				Agent.build({
					name: 'Devin Text'
				}).save().success(function(agent) {
					AgentPhone.build({
						number: '14152053084',
						primary: true
					}).save().success(function(agentPhone) {
						User.build({
							name: 'devin',
							email: 'trest@arzynik.com'
						}).save().success(function(user) {
							Plan.build({
								name: 'Free',
								price: 0,
								permalink: 'free',
								description: 'Free plan does not include a unique number'
							}).save().success(function(plan) {
					
								// add associations
								project.addProjectPhone(projectPhone);
								agent.addAgentPhone(agentPhone);
								project.addAgent(agent);
								project.addUser(user);
								plan.addProject(project);
							});
						});
					});
				});
			});
		});
		
		
		// other data
		Plan.create({
			name: 'Startup',
			price: 10,
			permalink: 'startup',
			description: 'We reccomend!'
		});
		Plan.create({
			name: 'Basic',
			price: 40,
			permalink: 'basic',
			description: 'hi'
		});
		Plan.create({
			name: 'Pro',
			price: 100,
			permalink: 'pro',
			description: 'rawr'
		});
		
	});

	res.send('all reset!');
});


app.listen(6000);
app.use(express.static(__dirname + '/public'));

var clients = [];
var clearDC = function() {
	for (x in clients) {
		if (clients[x].socket.disconnected) {			
			clients.splice(x, 1);
		}
	}
}

var io = require('socket.io').listen(6001);
io.sockets.on('connection', function (socket) {
	clients[clients.length] = socket;

	socket.on('message.config', function (data) {
		// send back the config data
		
	});
});