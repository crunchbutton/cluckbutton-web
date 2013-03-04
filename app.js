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
	
    token: Sequelize.STRING
});

var Question = sequelize.define('Question', {
	title: Sequelize.STRING,
	description: Sequelize.TEXT
});

var Plan = sequelize.define('Plan', {
	name: Sequelize.STRING,
	description: Sequelize.TEXT,
	price: Sequelize.STRING,
	permalink: Sequelize.STRING
});

var Session = sequelize.define('Session', {
	incomingNumber: Sequelize.STRING,
	outgoingNumber: Sequelize.STRING,
	sid: Sequelize.STRING,
	subscribed: Sequelize.INTEGER
});

var Message = sequelize.define('Message', {
	data: Sequelize.TEXT,
	direction: Sequelize.STRING,
	number: Sequelize.STRING,
	incoming: Sequelize.STRING,
	sid: Sequelize.STRING,
	body: Sequelize.TEXT
});

// set up associations
Project
	.hasMany(Agent)
	.hasMany(ProjectPhone)
	.hasMany(Session)
	.hasMany(User);
	
Agent
	.hasMany(Project)
	.hasMany(AgentPhone);
	
User
	.hasMany(Project);
Plan
	.hasMany(Project);

ProjectPhone.belongsTo(Project);
AgentPhone.belongsTo(Agent);
Session.belongsTo(Project);
Project.belongsTo(Plan);

sequelize.sync();


// create our server
var app = express.createServer();
app.use(express.cookieParser('keyboard cat'));
app.use(express.bodyParser());
app.use(express.session({ secret: 'keyboard cat'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.set('views', __dirname + '/views');
app.set('view engine', 'tpl');
app.engine('tpl', hbs.__express);


// home page
app.get('/', function(req, res) {
	res.render('home', {
		pageHome: true
	});
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username}
                 , function(err, user) {

      if (err) { return done(err);}
         
      if (!user) {
        return done(null, false, { message: 'Incorrect username.'});
      }
      
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.'});
      }
      
                   return done(null, user); });
  }
));

app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/fuckthisshit',
                                   failureFlash: false}));

passport.serializeUser(function(user, done) {
  util.error(user, done)
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  util.error(id, done)
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// show messages
app.get('/messages', function(req, res) {
	Message.findAll().success(function(messages) {
		res.render('messages', {
			messages: messages
		});
	});
});

// show sessions
app.get('/sessions', function(req, res) {
	Session.findAll().success(function(sessions) {
		res.render('sessions', {
			sessions: sessions
		});
	});
});

// account
app.get('/account', function(req, res) {
	User.find(1).success(function(user) { // @todo insert userid
		res.render('account', {
			user: user,
			pageAccount: true,
			page: 'pricing'
		});
	});
});

// agent page (just a wrapper)
app.get('/agents', function(req, res) {
	User.find(1).success(function(user) { // @todo: need to find based on db session
		res.render('agents', {
			user: user,
			pageAccount: true
		});
	});
});

// contact page
app.get('/contact', function(req, res) {
	res.render('contact',{
		pageContact: true
	});
});

// plans page
app.get('/plans', function(req, res) {
	res.render('plans',{
		pagePlans: true,
		page: 'pricing'
	});
});

// settings page
app.get('/settings', function(req, res) {
	res.render('settings',{
		pageAccount: true
	});
});

// signup page
app.get(['/signup/:id','/signup'], function(req, res) {
	res.render('signup',{
		plan: {name: req.params[0] || 'startup'},
		pageAccount: true,
		page: 'tour'
	});
});

// questions page
app.get('/questions', function(req, res) {
	res.render('questions',{
		pageAccount: true
	});
});

// agent rest service
app.get('/api/project/:id/agents', function(req, res) {
	Project.find(req.params.id).success(function(project) {
		project.getAgents().success(function(agents) {
			res.send(JSON.stringify(agents));
		});
	});
});

// project rest service
app.get('/api/project/:id', function(req, res) {
	Project.find(req.params.id).success(function(project) {
		res.send(JSON.stringify(project));
	});
});

// current user
app.get('/api/user', function(req, res) {
	User.find(1).success(function(user) {
		res.send(JSON.stringify(user));
	});
});

// current users projects
app.get('/api/user/projects', function(req, res) {
	User.find(1).success(function(user) {
		user.getProjects().success(function(projects) {
			res.send(JSON.stringify(projects));
		});
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



var sendMessage = function(params) {

	// save the outbound message
	var message = Message.build({
		number: params.to,
		incoming: params.from,
		direction: 'out',
		sid: params.session.sid,
		body: params.body
	});
	message.save();

	// send using twilio
	twilio.sendSms({
		to: '+' + params.to,
		from: '+' + params.from,
		body: params.body
	}, params.complete);

};

var replyToSender = function(message, project, session, agent, text) {
	sendMessage({
		session: session,
		to: message.number,
		from: message.incoming,
		body: text,
		complete: function(err, responseData) {
			if (!err) {
				console.log('sending message to sender' + responseData.to);
			}
		}
	});
};

var sendWebMessage = function(params) {
console.log(params)	
	for (x in clients) {
		try {
			clients[x].emit(params.type, {
				message: params.body,
				phone: params.to,
				agent: params.agent,
				sid: params.sid
			});
		} catch(e) {
			console.log(e);
		}
	}
}

var processMessage = function(message, project, session, agent) {

	if (agent.length) {

		// this is an agent
		
		var sendAgentMessage = function(message, project, session, agent) {
				
			Session.find(session.subscribed).success(function(subscribed) {
				console.log(agent);
				sendWebMessage({
					agent: agent[0].name,
					type: 'message.agent',
					to: subscribed.outgoingNumber,
					from: message.incoming,
					body: message.body,
					sid: subscribed.id
				});

				sendMessage({
					session: session,
					to: subscribed.outgoingNumber,
					from: message.incoming,
					body: agent[0].name + ": \n" + message.body,
					complete: function(err, responseData) {
						if (!err) {
							console.log('sending message to user' + responseData.to);
						}
					}
				});
			});


		}

		if (message.body.substr(0,1) == '/') {
			// this is a command

		} else if (message.body.substr(0,1) == '@') {
			// this is a session subscription, or its sending to a specific session

			var sid = message.body.split(' ');
			console.log(sid[0].substr(1));
			Session.find(sid[0].substr(1)).success(function(subscribed) {
				if (subscribed && project.id == subscribed.ProjectId) {
					// valid session
					session.subscribed = subscribed.id;
					session.save();
					console.log('subscribing agent to' + subscribed.id);
					
					if (sid[1]) {
						sid.splice(0, 1);
						message.body = sid.join(' ');
						sendAgentMessage(message, project, session, agent);
					}
				} else {
					replyToSender(message, project, session, agent, 'This is an invalid session');
				}
			});

		} else {
			if (session.subscribed) {
				sendAgentMessage(message, project, session, agent);
			} else {
				replyToSender(message, project, session, agent, 'You are not subscribed to a session');
			}
		}



	} else {

		sendWebMessage({
			type: 'message.user',
			to: message.number,
			from: message.incoming,
			body: message.body,
			sid: session.id
		});

		// this is a user
		
		if (message.body.substr(0,1) == '/') {
			// this is a command
		} else if (message.body == 'help' || message.body == 'agent') {
			
		} else {
			// this is a response
		
			// determine where in the menu the user is
			
				// if the command is a response to a remote question
				
					// query remote question api. respond in callback
				
				// if the command is a response to a local question
				
					// prepare response. respond.
			
			// update the database with the new menu pointer and send a response
		}

		
		
		// @test: loop through all agents and send them the users message
		project.getAgents().success(function(agents) {
			for (var x in agents) {
				agents[x].getAgentPhones({where: {primary: true}}).success(function(phone) {

					// send the message
					sendMessage({
						session: session,
						to: phone[0].number,
						from: message.incoming,
						body: "@" + session.id + "\n" + message.body,
						complete: function(err, responseData) {
							if (!err) {
								console.log('sending message to agent' + responseData.to);
							}
						}
					});
				});
			}
		});
		return;
	}
};

// build a name out of a title
var buildName = function(title) {
	return title.replace(/^[0-9a-z]/ig,'').toLowerCase();
};

app.post('/signup/:id', function(req, res) {
	Plan.find({where: {permalink: id}}).success(function(plan) {
		if (plan) {
			Project.build({
				title: req.body.company,
		      	name: buildName(req.body.company)
		    }).save().success(function(project) {
				Agent.build({
					name: req.body.name,
					email: req.body.email
				}).save().success(function(agent) {
					AgentPhone.build({
						number: req.body.number,
						primary: true
					}).save().success(function(agentPhone) {
						User.build({
							name: req.body.username,
							email: req.body.email
						}).save().success(function(user) {
							agent.addAgentPhone(agentPhone);
							project.addAgent(agent);
							project.addUser(user);

							res.send(JSON.stringify({
								user: user,
								project: project
							}));
						});
					});
				});
			});
		} else {
			res.end();
		}
	});

});

// text response when people text
app.post('/twilio/sms', function(req, res) {
	var incomingNumber = req.body.To.replace('+','');
	var outgoingNumber = req.body.From.replace('+','');

    var name, body;
	// @todo removed this for now
    if (1==1 || (name = req.body.Body.match(/@[^ ]+/)) == null) {
      body = req.body.Body
    } else {
      name = name[0].match(/@(.*)/)[1]
      body = req.body.Body.match(/@[^]+ +(.*)/)[1]
    }

	// save the inbound message
	var message = Message.build({
		data: JSON.stringify(req.body),
		number: outgoingNumber,
		incoming: incomingNumber,
		direction: 'in',
		sid: req.body.SmsSid,
		body: body
	});
	message.save();
	
	// once we have the project and the session
	var gotSession = function(project, session) {
		// determine if the outgoing number is an agent or not
		Agent.findAll({
			where: {
				'AgentPhones.number': outgoingNumber,
				'Projects.id': project.id
			},
			include: ['AgentPhone','Project']
		}).success(function(agent) {
			processMessage(message, project, session, agent);
		});
	};

	// once we get the project
	var gotProject = function(project) {
		if (project) {
			// get the session by unique to/from
			Session.find({where: {
				outgoingNumber: outgoingNumber,
				incomingNumber: outgoingNumber,
				ProjectId: project.id
			}}).success(function(session) {
				if (session) {
					// we found a session
					gotSession(project, session);
				} else {
					// there was no session. build one, save it, and continue
					Session.build({
						sid: req.body.SmsSid,
					    outgoingNumber: outgoingNumber,
					    incomingNumber: incomingNumber
					}).save().success(function(session) {
						gotSession(project, session);
						session.setProject(project);
					});
				}
			});
		} else {
			// not associated with a project. dont do anything
		}
	};
	
	// find the project
    if (name != null) {
	  Project.find({where: {name: name}})
		.success(function(project) {
          gotProject(project)
		})
		.error(function() {
		  // failed to get the project. dont do anything
		});
    } else {
	  ProjectPhone.find({where: {number: incomingNumber}})
		.success(function(number) {
		  if (number) {
			number.project(gotProject)
		  } else {
			// invalid number. dont do anything
		  }
		})
		.error(function() {
		  // failed to get the number. dont do anything
		});
    }
    res.end();

});


// voice response when people call
app.post('/twilio/voice', function(req, res) {
	var resp = new twiml();
	resp.say('To contact us, please send us a text message. Good Bye.', {
	    voice:'woman'
	});
	res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(resp.toString());
});


app.listen(process.env.VCAP_APP_PORT || 3000);
app.use(express.static(__dirname + '/public'));

var clients = [];
var clearDC = function() {
	for (x in clients) {
		if (clients[x].socket.disconnected) {			
			clients.splice(x, 1);
		}
	}
	for (x in jabber) {
		if (jabber[x].jabber.state == 0) {
			jabber.splice(x, 1);
		}
	}
}

var io = require('socket.io').listen(3001);
io.sockets.on('connection', function (socket) {
	clients[clients.length] = socket;

	socket.on('message.agent', function (data) {
		console.log(data);
		data.phone = '14052799645';
		
		// save the inbound message
		var message = Message.build({
			number: 'WEB',
			incoming: '3107733622',
			direction: 'in',
			sid: 'WEB',
			body: data.body
		});
		message.save();

		Project.find(1).success(function(project) {
			Agent.findAll({where: {id: 1}}).success(function(agent) {
				Session.find({where: {
					outgoingNumber: data.phone,
					incomingNumber: '13107733622',
					ProjectId: project.id
				}}).success(function(session) {
					console.log(session);
					processMessage(message, project, session, agent);
				});
			});
		});
	});
});


/*


var server = require('http').Server(app);
var io = require('socket.io')(server);
io.on('connection', function(){
	console.log('asd');
});
server.listen(3001);
*/
