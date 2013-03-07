




// @todo add @2x detection


var g_resources = [
	{
		name: 'area01_level_tiles',
		type: 'image',
		src: 'data/tileset/area01_level_tiles.png'
	},
	{
		name: 'metatiles32x32',
		type: 'image',
		src: 'data/tileset/metatiles32x32.png'
	}, 
	{
		name: 'area01',
		type: 'tmx',
		src: 'data/map/area01.tmx'
	}, 
	{
		name: 'area02',
		type: 'tmx',
		src: 'data/map/area02.tmx'
	},
	{
		name: 'area03',
		type: 'tmx',
		src: 'data/map/area03.tmx'
	},
	{
		name: 'red-run',
		type: 'image',
		src: 'data/img/red-run.png'
	},
	{
		name: 'title_screen',
		type: 'image',
		src: 'data/bg/title.jpg'
	},
	{
		name: 'hills1',
		type: 'image',
		src: 'data/bg/hills1.png'
	},
		{
		name: 'hill2',
		type: 'image',
		src: 'data/bg/hill2.png'
	},
	{
		name: 'clouds_small',
		type: 'image',
		src: 'data/bg/clouds_small.png'
	},
	{
		name: 'clouds_large',
		type: 'image',
		src: 'data/bg/clouds_large.png'
	},
	{
		name: 'blank-screen',
		type: 'image',
		src: 'data/bg/blank.png'
	},
	{
		name: 'control-dpad',
		type: 'image',
		src: 'data/img/control-dpad.png'
	},
	{
		name: 'cupcake',
		type: 'image',
		src: 'data/img/cupcake.png'
	}, 
	{
		name: 'elephant',
		type: 'image',
		src: 'data/img/elephant.png'
	},
	{
		name: 'dpad-center-R',
		type: 'image',
		src: 'data/img/dpad-center-R.png'
	},
	{
		name: 'dpad-center-L',
		type: 'image',
		src: 'data/img/dpad-center-L.png'
	},
	// game font
	{
		name: '16x16_font',
		type: 'image',
		src: 'data/img/16x16_font.png'
	}, 
	{
		name: '12x12_font',
		type: 'image',
		src: 'data/img/12x12_font.png'
	}, 
	// audio resources
	{
		name: 'cling',
		type: 'audio',
		src: 'data/audio/',
		channel: 2
	}, {
		name: 'stomp',
		type: 'audio',
		src: 'data/audio/',
		channel: 1
	}, {
		name: 'jump',
		type: 'audio',
		src: 'data/audio/',
		channel: 1
	}, {
		name: 'jump-and-run',
		type: 'audio',
		src: 'data/audio/',
		channel: 1
	}, {
		name: 'next-level',
		type: 'audio',
		src: 'data/audio/',
		channel: 1
	}
];

var g = a = null;

/**
 * the game
 */
var jsApp = {
	config: {
		width: 1136/2,
		height: 640/2
	},
	auth: {},
	onload: function() {
		var self = this;

		if (!me.video.init('jsapp', this.config.width, this.config.height, false, 'auto')) {
			alert('Sorry but your browser does not support html 5 canvas. You will not be able to play CluckButton. Sorry!');
			return;
		}
		
		// show the hijack screen to prevent popup blocking
		$('#hijack').css({
			height:this.config.height,
			width: this.config.width
		}).show();
		$('#hijack .message').html('');
		
		this.user = new User();
		
		$('#hijack').click(function() {
			if (!me.loaded || self.user.processing) {
				return;
			}
			self.user.processing = true;
			me.input.triggerKeyEvent(me.input.KEY.ENTER, true);

			self.user.auth(function() {

				self.gameserver = new GameServer(self.user, function() {

					self.user.processing = false;
					$('#hijack').hide();
					$('#hijack .message').html('');
		
					setTimeout(function() {
						me.state.change(me.state.PLAY);
						me.state.resume(true);	
					}, 100);
				});
			});
		});

		// prepare resources and init app
		me.loadingScreen = new LoadingScreen();
		me.audio.init('mp3,ogg');
		me.loader.onload = this.loaded.bind(this);
		me.loader.preload(g_resources);
		me.state.change(me.state.LOADING);		
		me.debug.renderHitBox = DEBUG;
		this.resetStats();

		me.game.DEATH_OBJECT = 'death_object';
		me.game.WATER_OBJECT = 'water_object';
		
		me.sys.resumeOnFocus = false;
		me.sys.pauseOnBlur = false;

		me.loaded = false;
		//me.sys.interpolation = true;
		//me.sys.useNativeAnimFrame = true;
		
		me.level = function() {
			return me.game.currentLevel.name ? Levels[me.game.currentLevel.name] : false;
		};

		// pause & menu
		me.event.subscribe(me.event.KEYDOWN, function(e) {
			if (me.input.isKeyPressed('menu')) {
				if (me.state.isRunning()) {
					me.state.onPause();
				} else {
					me.state.resume(true);
					me.state.onResume();
				}
			}
		});

		this.playTime = new Stopwatch(function() {
			me.game.HUD.setItemValue('time',
				stopwatchNumber(this.getElapsed().minutes) + ':' +
				stopwatchNumber(this.getElapsed().seconds) + ':' +
				stopwatchNumber(this.getElapsed().milliseconds/10)
			);
		}, 100);

		var first = true;
		me.event.subscribe(me.event.LEVEL_LOADED,function(level) {
			if (!first) {
				// record level stats
				self.gameserver.endLevel(function() {
					self.resetStats()
				});
				
				me.audio.play('next-level');
			} else {
				first = false;
			}
			self.playTime.restart();
		});
		
		me.state.onPause = function() {
			// stop game timer
			if (!first) {
				self.playTime.stop();
			}
			Menu.show();
		};
		
		me.state.onResume = function() {
			// resume game timer
			if (!first) {
				self.playTime.start();
			}
			Menu.hide();
		};
	},
	resetStats: function() {
		me.stats = {
			jumps: 0,
			startTime: 0,
			endTime: 0,
			elapsed: 0,
			collected: 0,
			killed: 0,
			falls: 0,
			injury: 0,
			score: 0
		};
	},
	loaded: function() {

		// states and transitions
		me.state.CONNECTING = me.state.USER + 1;

		me.state.set(me.state.MENU, new TitleScreen());
		me.state.setTransition(me.state.MENU, false);

		me.state.set(me.state.PLAY, new PlayScreen());
		me.state.setTransition(me.state.PLAY, true);

		me.state.set(me.state.CONNECTING, new ConnetingScreen());
		me.state.setTransition(me.state.CONNECTING, false);

		me.state.transition('fade', '#eaf7fd', 250);

		// object pool
		me.entityPool.add('mainPlayer', PlayerEntity);
		me.entityPool.add('CoinEntity', CoinEntity);
		me.entityPool.add('EnemyEntity', EnemyEntity);
		me.entityPool.add('DeathEntity', DeathEntity);
		me.entityPool.add('WaterEntity', WaterEntity);
	 
		// display main menu
		me.state.change(me.state.MENU);
	}
};


/**
 * the game player screen
 */
var PlayScreen = me.ScreenObject.extend({
	onResetEvent: function() {
		me.audio.playTrack('jump-and-run');
		me.levelDirector.loadLevel('area01');

		// bind inputs
		me.input.bindKey(me.input.KEY.ENTER, 'menu', true);
		me.input.bindKey(me.input.KEY.LEFT, 'left');
		me.input.bindKey(me.input.KEY.RIGHT, 'right');
		me.input.bindKey(me.input.KEY.UP, 'jump', true);
		me.input.bindKey(me.input.KEY.SPACE, 'jump', true);

		me.input.bindKey(me.input.KEY.A, 'left');
		me.input.bindKey(me.input.KEY.D, 'right');
		me.input.bindKey(me.input.KEY.W, 'jump', true);
		
		me.input.bindKey(me.input.KEY.X, 'debug', true);
		me.input.bindKey(me.input.KEY.Z, 'run');
		
		me.input.bindKey(me.input.KEY.NUM1, 'level1', true);
		me.input.bindKey(me.input.KEY.NUM2, 'level2', true);
		me.input.bindKey(me.input.KEY.NUM3, 'level3', true);

		/* @todo: ios controls
		me.game.add((new ControlsDpadRight(65,me.game.viewport.height-65)), 100);
		me.game.add((new ControlsDpadLeft(20,me.game.viewport.height-65)), 100);
		me.game.add((new ControlsButtonOne(me.game.viewport.width-65,me.game.viewport.height-65)), 100);
		*/

		me.game.addHUD(0, 10, me.game.viewport.width, 60);
		me.game.HUD.addItem('score', new ScoreObject(me.game.viewport.width-10, 0));
		me.game.HUD.addItem('time', new ScoreObject(me.game.viewport.width-10, 20));

		me.game.sort();
		
		me.sys.resumeOnFocus = true;
		me.sys.pauseOnBlur = true;
	},
	onDestroyEvent: function() {
		me.game.disableHUD();
		me.audio.stopTrack();
		
		me.input.unbindKey(me.input.KEY.ENTER);
		me.input.bindKey(me.input.KEY.LEFT);
		me.input.bindKey(me.input.KEY.RIGHT);
		me.input.bindKey(me.input.KEY.UP);
		me.input.bindKey(me.input.KEY.SPACE);

		me.input.bindKey(me.input.KEY.A);
		me.input.bindKey(me.input.KEY.D);
		me.input.bindKey(me.input.KEY.W);
		
		me.input.bindKey(me.input.KEY.X);
		me.input.bindKey(me.input.KEY.Z);
		
		me.input.bindKey(me.input.KEY.NUM1);
		me.input.bindKey(me.input.KEY.NUM2);
		me.input.bindKey(me.input.KEY.NUM3);
	}
});


window.onReady(function() {
	jsApp.onload();
});


// menu object.
var Menu = {
	menu: null,
	trickShow: false,
	show: function(trick) {
		// this can be triggered if it is already paused
		if (!this.trickShow) {
			this.trickShow = true;
			if (!Menu.menu) {
				Menu.menu = new PauseMenu(10,10);
				
			}
			me.game.add(Menu.menu, 100);
			Menu.menu.show();
			me.game.sort();
			me.state.resume(false);

			// this is a timeout hack to prevent the screen from not drawing the menu
			setTimeout(function() {
				me.state.pause(true);
				me.event.publish(me.state.STATE_PAUSE);
				me.state.onPause();
			}, 20);
		} else {
			this.trickShow = false;
		}


	},
	hide: function() {
		if (Menu.menu) {
			//me.game.remove(Menu.menu);
			Menu.menu.hide();
		}
	}
};














// * Stopwatch class {{{
Stopwatch = function(listener, resolution) {
	this.startTime = 0;
	this.stopTime = 0;
	this.totalElapsed = 0; // * elapsed number of ms in total
	this.started = false;
	this.listener = (listener != undefined ? listener : null); // * function to receive onTick events
	this.tickResolution = (resolution != undefined ? resolution : 500); // * how long between each tick in milliseconds
	this.tickInterval = null;
	
	// * pretty static vars
	this.onehour = 1000 * 60 * 60;
	this.onemin  = 1000 * 60;
	this.onesec  = 1000;
}
Stopwatch.prototype.start = function() {
	var delegate = function(that, method) { return function() { return method.call(that) } };
	if(!this.started) {
		this.startTime = new Date().getTime();
		this.stopTime = 0;
		this.started = true;
		this.tickInterval = setInterval(delegate(this, this.onTick), this.tickResolution);
	}
}
Stopwatch.prototype.stop = function() {
	if(this.started) {
		this.stopTime = new Date().getTime();
		this.started = false;
		var elapsed = this.stopTime - this.startTime;
		this.totalElapsed += elapsed;
		if(this.tickInterval != null)
			clearInterval(this.tickInterval);
	}
	return this.getElapsed();
}
Stopwatch.prototype.reset = function() {
	this.totalElapsed = 0;
	// * if watch is running, reset it to current time
	this.startTime = new Date().getTime();
	this.stopTime = this.startTime;
}
Stopwatch.prototype.restart = function() {
	this.stop();
	this.reset();
	this.start();
}
Stopwatch.prototype.getElapsed = function() {
	// * if watch is stopped, use that date, else use now
	var elapsed = 0;
	if(this.started)
		elapsed = new Date().getTime() - this.startTime;
	elapsed += this.totalElapsed;
	
	var hours = parseInt(elapsed / this.onehour);
	elapsed %= this.onehour;
	var mins = parseInt(elapsed / this.onemin);
	elapsed %= this.onemin;
	var secs = parseInt(elapsed / this.onesec);
	var ms = elapsed % this.onesec;
	
	return {
		hours: hours,
		minutes: mins,
		seconds: secs,
		milliseconds: ms,
		total: elapsed
	};
}
Stopwatch.prototype.setElapsed = function(hours, mins, secs) {
	this.reset();
	this.totalElapsed = 0;
	this.totalElapsed += hours * this.onehour;
	this.totalElapsed += mins  * this.onemin;
	this.totalElapsed += secs  * this.onesec;
	this.totalElapsed = Math.max(this.totalElapsed, 0); // * No negative numbers
}
Stopwatch.prototype.toString = function() {
	var zpad = function(no, digits) {
		no = no.toString();
		while(no.length < digits)
			no = '0' + no;
		return no;
	}
	var e = this.getElapsed();
	return zpad(e.hours,2) + ":" + zpad(e.minutes,2) + ":" + zpad(e.seconds,2);
}
Stopwatch.prototype.setListener = function(listener) {
	this.listener = listener;
}
// * triggered every <resolution> ms
Stopwatch.prototype.onTick = function() {
	if(this.listener != null) {
		this.listener(this);
	}
}
// }}}


function stopwatchNumber(number) {
	var width = 2;
	number = number.toFixed(0);
	width -= number.toString().length;
	if (width > 0) {
		return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;
	}
	return number + '';
}

/*
var Socket = function(complete) {
	var socket = io.connect('http://cluckbutton.localhost:6001');
	socket.on('connected', function (message) {
		if (complete) {
			complete(message);
		}
	});
	socket.on('message.user', function (message) {
		console.log(message);
		createMessage(message, 'user');
		//socket.emit('my other event', { my: 'data' });
	});
	
	socket.on('message.agent', function (message) {
		console.log(message);
		createMessage(message, 'agent');
		//socket.emit('my other event', { my: 'data' });
	});
	
	return socket;
};
*/

var GameServer = function(user, conected) {
	
	var api = {
		user: user
	};
	
	// request a level start. must return token values
	api.startLevel = function(level, complete) {
		$.getJSON('/level/start', {
			level: level,
			
		}, function(json) {
			if (complete) {
				complete(json.play);
			}
		});
	};
	
	// publish scores, and track the level as completed
	api.endLevel = function(play, stats, complete) {
		stats.play = play;

		$.getJSON('/level/start', stats, function(json) {
			if (complete) {
				complete(json.success);
			}
		});
	};

	// authenticate the user
	$.getJSON('/setup', {
		token: jsApp.auth.token
	}, function(res) {
		if (conected) {
			conected(res);
		}
	});

	return api;

};


var User = function(complete) {

	var api = {
		processing : false
	};

	api.auth = function(complete) {
		$('#hijack .message').html('logging you in with facebook...');

		api.user(function() {
			$('#hijack .message').html('connecting to server...');
		
			if (complete) {
				complete();
			}

		}, function() {
			api.processing = false;
			$('#hijack .message').html('there was an error connecting to facebook.<br /><br />click here to try again.');
		}, complete);
	};

	api.user = function(success, error, complete) {

		// return the user if we already have it
		if (jsApp.auth.name) {
			success(jsApp.auth);
			return;
		}

		// get the user details	
		var complete = function() {
			FB.api('/me', function(response) {
				response.token = jsApp.auth.token;
				jsApp.auth = response;
				success(jsApp.auth);
			});
		}

		// log us in if we dont have an auth id
		if (!jsApp.auth.id) {
			FB.login(function(response) {
				if (response.authResponse) {
					// logged in
					jsApp.auth.id = response.authResponse.userID;
					complete();
				} else {
					error();
				}
			});
		} else {
			complete();
		}
	}
	
	if (complete) {
		api.auth(complete);
	}

	return api;
};