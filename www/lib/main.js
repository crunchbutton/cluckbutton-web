var DEBUG = true;

var g_resources = [
	{
		name: "area01_level_tiles",
		type: "image",
		src: "data/tileset/area01_level_tiles.png"
	},
	{
		name: "metatiles32x32",
		type: "image",
		src: "data/tileset/metatiles32x32.png"
	}, 
	// our level
	{
		name: "area01",
		type: "tmx",
		src: "data/map/area01.tmx"
	}, 
	{
		name: "area02",
		type: "tmx",
		src: "data/map/area02.tmx"
	}, 
	// the main player spritesheet
	{
		name: "red_run",
		type: "image",
		src: "data/img/red_run.png"
	},
	{
		name: "blue_run",
		type: "image",
		src: "data/img/blue_run.png"
	},
	{
		name: "black_jump",
		type: "image",
		src: "data/img/black_jump.png"
	},
	{
		name: "title_screen",
		type: "image",
		src: "data/bg/title.jpg"
	},
	// the parallax background
	{
		name: "clouds_small",
		type: "image",
		src: "data/bg/clouds_small.png"
	},
	{
		name: "clouds_large",
		type: "image",
		src: "data/bg/clouds_large.png"
	}, 
	// the spinning coin spritesheet
	{
		name: "spinning_coin_gold",
		type: "image",
		src: "data/img/spinning_coin_gold.png"
	}, 
	// our enemty entity
	{
		name: "wheelie_right",
		type: "image",
		src: "data/img/wheelie_right.png"
	},
	// game font
	{
		name: "32x32_font",
		type: "image",
		src: "data/img/32x32_font.png"
	}, 
	// audio resources
	{
		name: "cling",
		type: "audio",
		src: "data/audio/",
		channel: 2
	}, {
		name: "stomp",
		type: "audio",
		src: "data/audio/",
		channel: 1
	}, {
		name: "jump",
		type: "audio",
		src: "data/audio/",
		channel: 1
	}, {
		name: "jump-and-run",
		type: "audio",
		src: "data/audio/",
		channel: 1
	}
];

var g = null;

var jsApp = {
	config: {
		width: 1136/2,
		height: 640/2
	},
	onload: function() {
		if (!me.video.init('jsapp', this.config.width, this.config.height, false, 1.0)) {
			alert("Sorry but your browser does not support html 5 canvas.");
			return;
		}
		
		me.loadingScreen = new LoadingScreen();
		me.audio.init('mp3,ogg');
		me.loader.onload = this.loaded.bind(this);
		me.loader.preload(g_resources);
		me.state.change(me.state.LOADING);		
		me.debug.renderHitBox = DEBUG;
		me.game.DEATH_OBJECT = 'death_object';
	},

	/* ---
		callback when everything is loaded

		--- */
	loaded: function() {
		// set the "Play/Ingame" Screen Object
		me.state.set(me.state.MENU, new TitleScreen());

		// set the "Play/Ingame" Screen Object
		me.state.set(me.state.PLAY, new PlayScreen());

		// set a global fading transition for the screen
		me.state.transition("fade", "#eaf7fd", 250);
	 
		// add our player entity in the entity pool
		me.entityPool.add("mainPlayer", PlayerEntity);
		me.entityPool.add("CoinEntity", CoinEntity);
		me.entityPool.add("EnemyEntity", EnemyEntity);
		me.entityPool.add("DeathEntity", DeathEntity);
	 
		// enable the keyboard
		me.input.bindKey(me.input.KEY.LEFT, "left");
		me.input.bindKey(me.input.KEY.RIGHT, "right");
		me.input.bindKey(me.input.KEY.SPACE, "jump", true);
	 
		// display the menu title
		me.state.change(me.state.MENU);
	}

};


var PlayScreen = me.ScreenObject.extend({
	onResetEvent: function() {
		me.audio.playTrack('jump-and-run');

		// load a level
		me.levelDirector.loadLevel("area01");
 
		// add a default HUD to the game mngr
		me.game.addHUD(0, 430, 640, 60);
 
		// add a new HUD item
		me.game.HUD.addItem('score', new ScoreObject(320, 10));
 
		// make sure everyhting is in the right order
		me.game.sort();
 
	},
	onDestroyEvent: function() {
		// remove the HUD
		me.game.disableHUD();
		
		me.audio.stopTrack();
	}
 
});

window.onReady(function() {
	jsApp.onload();
});
