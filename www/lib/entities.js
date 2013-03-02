/*------------------- 
a player entity
-------------------------------- */
var PlayerEntity = me.ObjectEntity.extend({
 
	/* -----
	 
		constructor
	 
		------ */
	 
	init: function(x, y, settings) {
		g = this;
		// call the constructor
		this.parent(x, y, settings);
	 
		// set the walking & jumping speed
		this.setVelocity(5, 15);
	 
		// adjust the bounding box
		this.updateColRect(8, 48, -1, 0);
	 
		// set the display to follow our position on both axis
		me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
	 
	},
	
	death: function() {
		if (!this.alive) {
			return;
		}
		me.audio.play('cling');
		me.game.HUD.updateItemValue('score', -500);
		me.levelDirector.loadLevel('area01');
		
		this.flicker(45);
		this.alive = false;
		var self = this;

		setTimeout(function() {
			self.alive = true;
		}, 500);
	},
	update: function() {
		if (me.input.isKeyPressed('left')) {
			// flip the sprite on horizontal axis
			this.flipX(true);
			// update the entity velocity
			this.vel.x -= this.accel.x * me.timer.tick;
		} else if (me.input.isKeyPressed('right')) {
			// unflip the sprite
			this.flipX(false);
			// update the entity velocity
			this.vel.x += this.accel.x * me.timer.tick;
		} else {
			this.vel.x = 0;
		}

		if (me.input.isKeyPressed('jump')) {
			if (!this.jumping && !this.falling)  {
				// set current vel to the maximum defined value
				// gravity will then do the rest
				this.vel.y = -this.maxVel.y * me.timer.tick;
				// set the jumping flag
				this.jumping = true;
				// play some audio 
				me.audio.play('jump');
			}
		}

		// check & update player movement
		this.updateMovement();
	 
		// check for collision
		var res = me.game.collide(this);
		
		if (me.game.currentLevel.realheight - this.pos.y - this.hHeight < 0) {
			this.death();
		}

		if (res && this.alive) {
			if (res.obj.type == me.game.ENEMY_OBJECT) {
				if ((res.y > 0) && ! this.jumping) {
					// bounce (force jump)
					this.falling = false;
					this.vel.y = -this.maxVel.y * me.timer.tick;
					// set the jumping flag
					this.jumping = true;
					// play some audio
					me.audio.play("stomp");
				} else {
					// let's flicker in case we touched an enemy
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

/*----------------
 a Coin entity
------------------------ */
var CoinEntity = me.CollectableEntity.extend({
	// extending the init function is not mandatory
	// unless you need to add some extra initialization
	init: function(x, y, settings) {
		// call the parent constructor
		this.parent(x, y, settings);
	},
 
	onCollision : function ()
	{
		// do something when collected
	 
		// play a "coin collected" sound
		me.audio.play("cling");
	 
		// give some score
		me.game.HUD.updateItemValue("score", 250);
	 
		// make sure it cannot be collected "again"
		this.collidable = false;
		// remove it
		me.game.remove(this);
	}
 
});


/*----------------
 a death entity
------------------------ */
var DeathEntity = me.InvisibleEntity.extend({
	init: function(x, y, settings) {
		// call the parent constructor
		this.parent(x, y, settings);
		this.type = me.game.DEATH_OBJECT;
	},
	onCollision: function () {
	
	}
});



/* --------------------------
an enemy Entity
------------------------ */
var EnemyEntity = me.ObjectEntity.extend({
	init: function(x, y, settings) {
		// define this here instead of tiled
		settings.image = "wheelie_right";
		settings.spritewidth = 64;
 
		// call the parent constructor
		this.parent(x, y, settings);
 
		this.startX = x;
		this.endX = x + settings.width - settings.spritewidth;
		// size of sprite
 
		// make him start from the right
		this.pos.x = x + settings.width - settings.spritewidth;
		this.walkLeft = true;
 
		// walking & jumping speed
		this.setVelocity(2, 6);
 
		// make it collidable
		this.collidable = true;
		// make it a enemy object
		this.type = me.game.ENEMY_OBJECT;
		
		this.updateColRect(8, 48, -1, 0);
 
	},
 
	// call by the engine when colliding with another object
	// obj parameter corresponds to the other object (typically the player) touching this one
	onCollision: function(res, obj) {
 
		// res.y >0 means touched by something on the bottom
		// which mean at top position for this one
		if (this.alive && (res.y > 0) && obj.falling) {
			this.flicker(45);
		}
	},
 
	// manage the enemy movement
	update: function() {
		// do nothing if not visible
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
 		
		// check and update movement
		this.updateMovement();
 		
		// update animation if necessary
		if (this.vel.x!=0 || this.vel.y!=0) {
			// update object animation
			this.parent();
			return true;
		}
		return false;
	}
});



/*-------------- 
a score HUD Item
--------------------- */
 
var ScoreObject = me.HUD_Item.extend({
	init: function(x, y) {
		// call the parent constructor
		this.parent(x, y);
		// create a font
		this.font = new me.BitmapFont("32x32_font", 32);
	},
 
	/* -----
 
	draw our score
 
	------ */
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
			// this is how to use a bitmap font
//			this.font = new me.BitmapFont('32x32_font', 32);
			// this is how to use a real font
//			this.font = new me.Font('Amatic SC', 32, 'black', 'middle');
//			this.font.set('left');
		}
 
		// enable the keyboard
		me.input.bindKey(me.input.KEY.ENTER, "enter", true);
		me.input.bindMouse(me.input.mouse.LEFT, me.input.KEY.ENTER);
 
		// play something
		me.audio.play("cling");
 
	},
 
	// some callback for the tween objects
	scrollover: function() {

	},
 
	// update function
	update: function() {
		// enter pressed ?
		if (me.input.isKeyPressed('enter')) {
			me.state.change(me.state.PLAY);
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
	}
 
});


/**
 * custom loading screen
 */
var LoadingScreen = me.ScreenObject.extend({
	init : function() {
		this.parent(true);
		this.logo1 = new me.Font('Amatic SC', 32, 'black', 'middle');
		this.logo2 = new me.Font('Amatic SC', 32, 'black', 'middle');

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
		
		// measure the logo size
		var logo1_width = this.logo1.measureText(context, "Cluck").width;
		var xpos = (me.video.getWidth() - logo1_width - this.logo2.measureText(context, "Button").width) / 2;
		var ypos = me.video.getHeight() / 2;
			
		// clear surface
		me.video.clearSurface(context, "#eaf7fd");
		
		// draw the melonJS logo
		this.logo1.draw(context, 'Cluck', xpos , ypos);
		xpos += logo1_width;
		this.logo2.draw(context, 'Button', xpos, ypos);
		
		ypos += this.logo1.measureText(context, "cluck").height / 2;

		// display a progressive loading bar
		var progress = Math.floor(this.loadPercent * me.video.getWidth());

		// draw the progress bar
		context.strokeStyle = "silver";
		context.strokeRect(0, ypos, me.video.getWidth(), 6);
		context.fillStyle = "#f21622";
		context.fillRect(2, ypos + 2, progress - 4, 2);
	}
});
