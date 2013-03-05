var Levels = {
	area01: {
		gravity: .98,
		friction: {x: 0, y: 0},
		maxJumps: 2,
		airJump: true,
		maxTime: 60
	},
	area02: {
		gravity: .98,
		friction: {x: 0, y: 0},
		maxJumps: 2,
		airJump: true,
		maxTime: 60
	},
	water01: {
		gravity: .5,
		friction: {x: .4, y: .4},
		maxJumps: null,
		airJump: true,
		maxTime: 60
	}
};

var PauseMenu = me.GUI_Object.extend({	
	init:function(x, y) {
		settings = {}
		settings.image = 'red-run';
		settings.spritewidth = 100;
		settings.spriteheight = 50;
		this.parent(x, y, settings);
	},
	onClick:function() {
		me.state.resume();
		me.audio.resumeTrack();
		me.game.remove(this);
		return true;
	}
});

var ControlButton = me.GUI_Object.extend({
	init:function(x, y) {
		this.parent(x, y, settings);
		me.input.registerMouseEvent('mousedown', this, this.onMouseDown.bind(this));
		me.input.registerMouseEvent('mouseup', this, this.onMouseUp.bind(this));
	},
	onMouseDown: function() {
		me.input.triggerKeyEvent(this.key, true);
	},
	onMouseUp: function() {
		me.input.triggerKeyEvent(this.key, false);
	}
});

var ControlsDpadLeft = ControlButton.extend({
	init:function(x, y) {
		settings = {}
		settings.image = 'dpad-center-L';
		settings.spritewidth = 45;
		settings.spriteheight = 52;
		this.key = me.input.KEY.LEFT;
		this.parent(x, y, settings);
	}
});

var ControlsDpadRight = ControlButton.extend({	
	init:function(x, y) {
		settings = {}
		settings.image = 'dpad-center-R';
		settings.spritewidth = 45;
		settings.spriteheight = 52;
		this.key = me.input.KEY.RIGHT;
		this.parent(x, y, settings);
	}
});

var ControlsButtonOne = ControlButton.extend({	
	init:function(x, y) {
		settings = {}
		settings.image = 'dpad-center-R';
		settings.spritewidth = 45;
		settings.spriteheight = 52;
		this.key = me.input.KEY.SPACE;
		this.parent(x, y, settings);
	}
});


/**
 * player
 */
var PlayerEntity = me.ObjectEntity.extend({
	init: function(x, y, settings) {
		g = this;
		settings.image = 'red-run';
		settings.spritewidth = 64;
		settings.spriteheight = 64;

		this.maxJumps = me.level().maxJumps;
		this.jumps = 0;
		this.walkSpeed = 5;
		this.runSpeed = 8;
		this.currentImage = null;

		this.parent(x, y, settings);
		this.setVelocity(this.walkSpeed, 15);
		this.updateColRect(13, 42, 15, 48);
		
		this.gravity = me.level().gravity;
		if (me.level().friction) {
			this.setFriction(me.level().friction.x, me.level().friction.y);
		}
		
		var sf = 8;
		this.addAnimation('run', [0,1]);
		this.addAnimation('jump', [0+sf]);
		this.addAnimation('fall', [0+(sf*2)]);

		me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
	},
	death: function() {
		if (!this.alive) {
			return;
		}
		me.audio.play('cling');
		me.game.HUD.updateItemValue('score', -500);
		me.levelDirector.loadLevel(me.game.currentLevel.name);
		
		this.flicker(45);
		this.alive = false;
		var self = this;

		setTimeout(function() {
			self.alive = true;
		}, 500);
	},
	update: function() {


		// @todo: use easing math for frozen levels
		if (me.input.isKeyPressed('left')) {
			this.flipX(true);
			this.vel.x -= this.accel.x * me.timer.tick;

		} else if (me.input.isKeyPressed('right')) {
			this.flipX(false);
			this.vel.x += this.accel.x * me.timer.tick;

		} else {
			this.vel.x = 0;
		}
		
		if (!this.jumping && !this.falling && this.jumps) {
			this.jumps = 0;
		}

		if (me.input.isKeyPressed('jump')) {
			if (this.jumps < this.maxJumps)  {
				this.forceJump();
				me.audio.play('jump');
				this.jumps++;
			}
		}
		
		if (me.input.isKeyPressed('level1')) {
			me.levelDirector.loadLevel('area01');
		}
		
		if (me.input.isKeyPressed('level2')) {
			me.levelDirector.loadLevel('area02');
		}
		
		if (me.input.isKeyPressed('debug')) {
//			this.image = me.loader.getImage('blue_run');
			me.audio.play('jump');
			me.game.add((new EnemyEntity(this.pos.x - 200, this.pos.y - 100, {
				width: 518
			})), this.z);
			me.game.sort();
		}
		
		if (me.input.isKeyPressed('run')) {
			this.setVelocity(this.runSpeed, 15);
		} else {
			this.setVelocity(this.walkSpeed, 15);
		}
		
		// update to jumping sprite
		var img = null;
		if (this.jumping && !this.falling) {
			img = 'jump';
		} else if (this.falling) {
			img = 'fall';
		} else {
			img = 'run';
		}
		this.setCurrentAnimation(img);

		// check & update player movement
		this.updateMovement();
	 
		// check for collision
		var res = me.game.collide(this);
		
		if (me.game.currentLevel.realheight - this.pos.y - this.hHeight < 0) {
			this.death();
		}

		if (res && this.alive) {
			if (res.obj.type == me.game.ENEMY_OBJECT) {
				if ((res.y > 0) && !this.jumping && this.falling) {
					this.forceJump();
					this.jumps = 1;
					me.audio.play('stomp');
				} else {
					// let's flicker in case we touched an enemy
					//me.game.viewport.shake(10, 30, me.game.viewport.AXIS.BOTH);
					this.flicker(45);
				}
			} else if (res.obj.type == me.game.DEATH_OBJECT) {
				this.death();
			}
		}
	 
		// update animation if necessary
		if (this.vel.x!=0 || this.vel.y!=0) {
			// update object animation
			this.parent();
			return true;
		}
		// else inform the engine we did not perform
		// any update (e.g. position, animation)
		return false;   	
	 
	}
});


/**
 * collectable coin - gives points
 */
var CoinEntity = me.CollectableEntity.extend({
	init: function(x, y, settings) {
		settings.image = 'cupcake';
		settings.height = 32;
		settings.width = 32;
		settings.spritewidth = 32;
		this.parent(x, y, settings);
	},
 
	onCollision: function () {
		me.audio.play('cling');
		me.game.HUD.updateItemValue('score', 250);
		this.collidable = false;
		me.game.remove(this);
	}
});


/**
 * generic instant death entity
 */
var DeathEntity = me.InvisibleEntity.extend({
	init: function(x, y, settings) {
		// call the parent constructor
		this.parent(x, y, settings);
		this.type = me.game.DEATH_OBJECT;
	},
	onCollision: function () {
	
	}
});


/**
 * enemy
 */
var EnemyEntity = me.ObjectEntity.extend({
	init: function(x, y, settings) {
		settings.image = 'elephant';
		settings.spritewidth = 64;
 
		this.parent(x, y, settings);
 
		this.startX = x;
		this.endX = x + settings.width - settings.spritewidth;
		this.pos.x = x + settings.width - settings.spritewidth;
		this.walkLeft = true;
 
		this.setVelocity(2, 6);
 
		this.collidable = true;
		this.type = me.game.ENEMY_OBJECT;
		
		this.updateColRect(8, 53, 28, 34);
		
		this.addAnimation('walk', [0,1]);
		this.setCurrentAnimation('walk');
	},
	
	death: function() {
		this.flicker(45);
		this.alive = false;
		this.collidable = false;
		
		me.game.HUD.updateItemValue('score', 250);

		tweenUp = new me.Tween(this.pos).to({y: this.pos.y-40}, 200).onComplete(function() {
			tweenDown.start();
		});
		tweenUp.easing(me.Tween.Easing.Quartic.EaseOut);
		tweenUp.start();
		
		tweenDown = new me.Tween(this.pos).to({y: me.game.currentLevel.realheight}, 500).onComplete(function() {

		});
		tweenDown.easing(me.Tween.Easing.Quartic.EaseIn);
	},
 
	onCollision: function(res, obj) {
		// if the player jumps on his head
		if (this.alive && (res.y > 0) && obj.falling) {
			this.death();
		}
	},

	update: function() {
		if (!this.visible)
			return false;
 
		if (this.alive) {
			if (this.walkLeft && this.pos.x <= this.startX) {
				this.walkLeft = false;
			} else if (!this.walkLeft && this.pos.x >= this.endX) {
				this.walkLeft = true;
			}

			// make it walk
			this.flipX(this.walkLeft);
			this.vel.x += (this.walkLeft) ? -this.accel.x * me.timer.tick : this.accel.x * me.timer.tick;
 				
		} else {
			this.vel.x = 0;
		}

		this.updateMovement();

		if (this.vel.x!=0 || this.vel.y!=0) {
			this.parent();
			return true;
		}
		return false;
	}
});



/**
 * score and HUD
 */
var ScoreObject = me.HUD_Item.extend({
	init: function(x, y) {
		// call the parent constructor
		this.parent(x, y);
		// create a font
		this.font = new me.BitmapFont('16x16_font', 16);
	},

	draw: function(context, x, y) {
		this.font.draw(context, this.value, this.pos.x + x, this.pos.y + y);
	}
 
});


/**
 * title screen. before starting the game proper
 */
var TitleScreen = me.ScreenObject.extend({
	// constructor
	init: function() {
		this.parent(true);
		this.title = null;
		this.font = null;
	},
 
	// reset function
	onResetEvent: function() {
		if (this.title == null) {
			// init stuff if not yet done
			this.title = me.loader.getImage('title_screen');
		}
 
		// enable the keyboard
		me.input.bindKey(me.input.KEY.ENTER, 'enter', true);
		me.input.bindKey(me.input.KEY.SPACE, 'enter', true);
		me.input.bindMouse(me.input.mouse.LEFT, me.input.KEY.ENTER);
 
		// play something
		me.audio.play('cling');
	},
	// update function
	update: function() {
		// enter pressed ?
		if (me.input.isKeyPressed('enter')) {
			me.state.change(me.state.CONNECTING);
		}
		return true;
	},
 
	// draw function
	draw: function(context) {
		context.drawImage(this.title, 0, 0, jsApp.config.width, jsApp.config.height);
//		this.font.draw(context, "PRESS ENTER TO PLAY", 20, 240);
	},
 
	// destroy function
	onDestroyEvent: function() {
		me.input.unbindKey(me.input.KEY.ENTER);
		me.input.unbindKey(me.input.KEY.SPACE);
		me.input.unbindMouse(me.input.mouse.LEFT);
	}
 
});


/**
 * facebook connect screen
 */
var ConnetingScreen = me.ScreenObject.extend({
	init: function() {
		this.parent(true);
		this.title = me.loader.getImage('auth-connecting');
		this.font = null;
	},
	onResetEvent: function() {
		var self = this;

		if (this.title == null) {
			this.title = me.loader.getImage('auth-connecting');
		}
		
		jsApp.user(function() {
			me.state.change(me.state.PLAY);
		}, function() {
			if (confirm('there was an error connecting facebook. try again?')) {
				me.state.change(me.state.CONNECTING);
			} else {
				me.state.change(me.state.MENU);
			}
		});

	},
	draw: function(context) {
		context.drawImage(this.title, 0, 0, jsApp.config.width, jsApp.config.height);
	}
});


/**
 * custom loading screen
 */
var LoadingScreen = me.ScreenObject.extend({
	init : function() {
		this.parent(true);
		this.logo1 = new me.Font('Amatic SC', 32, 'black', 'middle');

		// flag to know if we need to refresh the display
		this.invalidate = false;

		// handle for the susbcribe function
		this.handle = null;
		
		// load progress in percent
		this.loadPercent = 0;		
	},

	// call when the loader is resetted
	onResetEvent : function() {
		// setup a callback
		this.handle = me.event.subscribe(me.event.LOADER_PROGRESS, this.onProgressUpdate.bind(this));
	},
	
	// destroy object at end of loading
	onDestroyEvent : function() {
		// "nullify" all fonts
		this.logo1 = this.logo2 = null;
		// cancel the callback
		if (this.handle)  {
			me.event.unsubscribe(this.handle);
			this.handle = null;
		}
	},

	// make sure the screen is refreshed every frame 
	onProgressUpdate : function(progress) {
		this.loadPercent = progress;
		this.invalidate = true;
	},

	// make sure the screen is refreshed every frame 
	update : function() {
		if (this.invalidate === true) {
			// clear the flag
			this.invalidate = false;
			// and return true
			return true;
		}
		// else return false
		return false;
	},

	draw : function(context) {
		var text = 'CluckButton';
		var logo1_width = this.logo1.measureText(context, text).width;
		var xpos = (me.video.getWidth() - logo1_width) / 2;
		var ypos = me.video.getHeight() / 2;

		me.video.clearSurface(context, '#eaf7fd');
		this.logo1.draw(context, text, xpos , ypos);
		ypos += this.logo1.measureText(context, text).height / 2;

		var progress = Math.floor(this.loadPercent * me.video.getWidth());
		context.strokeStyle = 'silver';
		context.strokeRect(0, ypos, me.video.getWidth(), 6);
		context.fillStyle = '#f21622';
		context.fillRect(2, ypos + 2, progress - 4, 2);
	}
});




//me.event.publish(me.event.KEYDOWN, [ action ]);
//			me.event.publish(me.event.LEVEL_LOADED, [level.name]);