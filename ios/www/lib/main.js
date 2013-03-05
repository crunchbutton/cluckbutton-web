




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
		name: 'auth-error',
		type: 'image',
		src: 'data/bg/auth-error.png'
	},
	{
		name: 'auth-connecting',
		type: 'image',
		src: 'data/bg/auth-connecting.png'
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
		if (!me.video.init('jsapp', this.config.width, this.config.height, false, 1.0)) {
			alert('Sorry but your browser does not support html 5 canvas. You will not be able to play CluckButton. Sorry!');
			return;
		}

		// prepare resources and init app
		me.loadingScreen = new LoadingScreen();
		me.audio.init('mp3,ogg');
		me.loader.onload = this.loaded.bind(this);
		me.loader.preload(g_resources);
		me.state.change(me.state.LOADING);		
		me.debug.renderHitBox = DEBUG;
		me.game.DEATH_OBJECT = 'death_object';
		
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
		
		me.state.onPause = function() {
			// stop game timer
			Menu.show();
		};
		
		me.state.onResume = function() {
			// resume game timer
			Menu.hide();
		};
	},
	loaded: function() {

		// states and transitions
		me.state.CONNECTING = me.state.USER + 1;
		a = new PlayScreen();
		me.state.set(me.state.MENU, new TitleScreen());
		me.state.set(me.state.PLAY, a);
		me.state.set(me.state.CONNECTING, new ConnetingScreen());
		me.state.transition('fade', '#eaf7fd', 250);

		// object pool
		me.entityPool.add('mainPlayer', PlayerEntity);
		me.entityPool.add('CoinEntity', CoinEntity);
		me.entityPool.add('EnemyEntity', EnemyEntity);
		me.entityPool.add('DeathEntity', DeathEntity);
	 
	 
		// display main menu
		me.state.change(me.state.MENU);
	},
	user: function(success, error) {
		// return the user if we already have it
		if (jsApp.auth.name) {
			success(jsApp.auth);
			return;
		}

		// get the user details	
		var complete = function() {
			FB.api('/me', function(response) {
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
			} else {
				Menu.menu.visible = true;
			}
			me.game.add(Menu.menu, 100);
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
			me.game.remove(Menu.menu);
		}
	}
};
