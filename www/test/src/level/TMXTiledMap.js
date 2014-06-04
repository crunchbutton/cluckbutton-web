/*
 * MelonJS Game Engine
 * Copyright (C) 2011 - 2013, Olivier BIOT
 * http://www.melonjs.org
 *
 * Tile QT 0.7.x format
 * http://www.mapeditor.org/	
 *
 */

(function($) {
		
	/**
	 * a TMX Tile Map Object
	 * Tile QT 0.7.x format
	 * @class
	 * @memberOf me
	 * @constructor
	 */
	me.TMXTileMap = Object.extend({
		// constructor
		init: function(tmxfile, x, y) {
			// map default position
			this.pos = new me.Vector2d(x, y);
						
			// map default z order
			this.z = 0;
			
			/**
			 * name of the tilemap
			 * @public
			 * @type String
			 * @name me.TMXTileMap#name
			 */
			this.name = null;
			
			/**
			 * width of the tilemap in Tile
			 * @public
			 * @type Int
			 * @name me.TMXTileMap#width
			 */
			this.width = 0;
			
			/**
			 * height of the tilemap in Tile
			 * @public
			 * @type Int
			 * @name me.TMXTileMap#height
			 */
			this.height = 0;

			/**
			 * width of the tilemap in pixels
			 * @public
			 * @type Int
			 * @name me.TMXTileMap#realwidth
			 */
			this.realwidth = -1;
			
			/**
			 * height of the tilemap in pixels
			 * @public
			 * @type Int
			 * @name me.TMXTileMap#realheight
			 */
			this.realheight = -1;

			/**
			 * Tile width
			 * @public
			 * @type Int
			 * @name me.TMXTileMap#tilewidth
			 */
			this.tilewidth = 0;

			/**
			 * Tile height
			 * @public
			 * @type Int
			 * @name me.TMXTileMap#tileheight
			 */
			this.tileheight = 0;

			// corresponding tileset for this map
			this.tilesets = null;

			// map layers
			this.mapLayers = [];

			// map Object
			this.objectGroups = [];

			// loading flag
			this.initialized = false;

			this.xmlMap = me.loader.getTMX(tmxfile);
			this.isJSON = me.loader.getTMXFormat(tmxfile) === 'json';

			if (!this.xmlMap) {
				throw "melonJS:" + tmxfile + " TMX map not found";
			};

			// tilemap version
			this.version = "";

			// map type (only orthogonal format supported)
			this.orientation = "";

			// tileset(s)
			this.tilesets = null;
			
		},
		
		/**
		 * a dummy update function
		 * @private
		 */
		reset : function() {
			if (this.initialized === true) {
				// reset/clear all layers
				for ( var i = this.mapLayers.length; i--;) {
					this.mapLayers[i].reset();
					this.mapLayers[i] = null;
				};
				// reset object groups
				for ( var i = this.objectGroups.length; i--;) {
					this.objectGroups[i].reset();
					this.objectGroups[i] = null;
				};
				// call parent reset function
				this.tilesets = null;
				this.mapLayers.length = 0;
				this.objectGroups.length = 0;
				this.pos.set(0,0);
				// set back as not initialized
				this.initialized = false;
			}
		},
		
		/**
		 * Load & initialize the Tile Map
		 * @private
		 */
		load : function() {
			// if already loaded, do nothing
			if (this.initialized)
				return;

			// to automatically increment z index
			var zOrder = 0;

			// init the parser
			me.TMXParser.parseFromString(this.xmlMap, this.isJSON);

			// retreive all the elements of the XML file
			var xmlElements = me.TMXParser.getAllTagElements();

			// parse all tags
			for ( var i = 0; i < xmlElements.length; i++) {

				// check each Tag
				switch (xmlElements.item(i).nodeName) {
					// get the map information
					case me.TMX_TAG_MAP: {
						var map = xmlElements.item(i);
						this.version = me.TMXParser.getStringAttribute(map, me.TMX_TAG_VERSION);
						this.orientation = me.TMXParser.getStringAttribute(map, me.TMX_TAG_ORIENTATION);
						this.width = me.TMXParser.getIntAttribute(map, me.TMX_TAG_WIDTH);
						this.height = me.TMXParser.getIntAttribute(map, me.TMX_TAG_HEIGHT);
						this.tilewidth = me.TMXParser.getIntAttribute(map,	me.TMX_TAG_TILEWIDTH);
						this.tileheight = me.TMXParser.getIntAttribute(map, me.TMX_TAG_TILEHEIGHT);
						this.realwidth = this.width * this.tilewidth;
						this.realheight = this.height * this.tileheight;
						this.backgroundcolor = me.TMXParser.getStringAttribute(map, me.TMX_BACKGROUND_COLOR);
						this.z = zOrder++;
					   
					   	// initilialize a new default renderer
						if ((me.game.renderer === null) || !me.game.renderer.canRender(this)) {
							switch (this.orientation) {
								case "orthogonal": {
								  me.game.renderer = new me.TMXOrthogonalRenderer(this.width, this.height, this.tilewidth, this.tileheight);
								  break;
								}
								case "isometric": {
								  me.game.renderer =  new me.TMXIsometricRenderer(this.width, this.height , this.tilewidth, this.tileheight);
								  break;
								}
								// if none found, throw an exception
								default : {
									throw "melonJS: " + this.orientation + " type TMX Tile Map not supported!";
								}
							}
						}

						// center the map if smaller than the current viewport
						if ((this.realwidth < me.game.viewport.width) || 
							(this.realheight < me.game.viewport.height)) {
							var shiftX =  ~~( (me.game.viewport.width - this.realwidth) / 2);
							var shiftY =  ~~( (me.game.viewport.height - this.realheight) / 2);
							// update the map default screen position
							this.pos.add({x:shiftX > 0 ? shiftX : 0 , y:shiftY > 0 ? shiftY : 0} );
						}

						// set the map properties (if any)
						me.TMXUtils.setTMXProperties(this, map);
						
						// check if a user-defined background color is defined  
						this.background_color = this.backgroundcolor ? this.backgroundcolor : this.background_color;
						if (this.background_color) {
							this.mapLayers.push(new me.ColorLayer("background_color", 
																  this.background_color, 
																  zOrder++));
						}

						// check if a background image is defined
						if (this.background_image) {
							// add a new image layer
							this.mapLayers.push(new me.ImageLayer("background_image", 
																  this.width, this.height, 
																  this.background_image, 
																  zOrder++));
						}
						break;
					};

					// get the tileset information
					case me.TMX_TAG_TILESET: {
					   // Initialize our object if not yet done
					   if (!this.tilesets) {
						  this.tilesets = new me.TMXTilesetGroup();
					   }
					   // add the new tileset
					   this.tilesets.add(new me.TMXTileset(xmlElements.item(i)));
					   break;
					};
					
					// get image layer information
					case me.TMX_TAG_IMAGE_LAYER: {
						
						// extract layer information
						var iln = me.TMXParser.getStringAttribute(xmlElements.item(i), me.TMX_TAG_NAME);
						var ilw = me.TMXParser.getIntAttribute(xmlElements.item(i), me.TMX_TAG_WIDTH);
						var ilh = me.TMXParser.getIntAttribute(xmlElements.item(i), me.TMX_TAG_HEIGHT);
						var ilsrc = xmlElements.item(i).getElementsByTagName(me.TMX_TAG_IMAGE)[0].getAttribute(me.TMX_TAG_SOURCE);
						
						// create the layer
						var ilayer = new me.ImageLayer(iln, ilw * this.tilewidth, ilh * this.tileheight, ilsrc, zOrder++);
						
						// set some additional flags
						ilayer.visible = (me.TMXParser.getIntAttribute(xmlElements.item(i), me.TMX_TAG_VISIBLE, 1) == 1);
						ilayer.opacity = me.TMXParser.getFloatAttribute(xmlElements.item(i), me.TMX_TAG_OPACITY, 1.0);
						
						// check if we have any properties 
						me.TMXUtils.setTMXProperties(ilayer, xmlElements.item(i));
		
						// add the new layer
						this.mapLayers.push(ilayer);
						break;
					};
					
					// get the layer(s) information
					case me.TMX_TAG_LAYER: {
						// regular layer or collision layer
						this.mapLayers.push(new me.TMXLayer(xmlElements.item(i), this.tilewidth, this.tileheight, this.orientation, this.tilesets, zOrder++));
						break;
					};
					
					// get the object groups information
					case me.TMX_TAG_OBJECTGROUP: {
					   var name = me.TMXParser.getStringAttribute(xmlElements.item(i), me.TMX_TAG_NAME);
					   this.objectGroups.push(new me.TMXOBjectGroup(name, xmlElements.item(i), this.tilesets, zOrder++));
					   break;
					};
					
					default : {
						// ignore unrecognized tags
						break;
					};
					
				} // end switch 
			
			} // end for

			// free the TMXParser ressource
			me.TMXParser.free();
			
			// flag as loaded
			this.initialized = true;

		},
		
		/**
		 * return the specified object group
		 * @private	
		 */
		getObjectGroupByName : function(name) {
			var objectGroup = null;
           		// normalize name
           		name = name.trim().toLowerCase();
           		for ( var i = this.objectGroups.length; i--;) {
               		if (this.objectGroups[i].name.toLowerCase().contains(name)) {
                   			objectGroup = this.objectGroups[i];
                   			break;
               		}
           		};
			return objectGroup;
		},

		/**
		 * return all the object group
		 * @private		
		 */
		getObjectGroups : function() {
			return this.objectGroups;
		},
		
		/**
		 * return all the existing layers
		 * @name me.TMXTileMap#getLayers
		 * @public
		 * @function
		 * @return {me.TMXLayer[]} Array of Layers
		 */
		getLayers : function() {
			return this.mapLayers;
		},

		/**
		 * return the specified layer object
		 * @name me.TMXTileMap#getLayerByName
		 * @public
		 * @function
		 * @param {String} name Layer Name 
		 * @return {me.TMXLayer} Layer Object
		 */
		getLayerByName : function(name) {
			var layer = null;

			// normalize name
			name = name.trim().toLowerCase();
			for ( var i = this.mapLayers.length; i--;) {
				if (this.mapLayers[i].name.toLowerCase().contains(name)) {
					layer = this.mapLayers[i];
					break;
				}
			};

			// return a fake collision layer if not found
			if ((name.toLowerCase().contains(me.LevelConstants.COLLISION_MAP)) && (layer == null)) {
				layer = new CollisionTiledLayer(me.game.currentLevel.realwidth,	me.game.currentLevel.realheight);
			}

			return layer;
		},

		/**
		 * clear the tile at the specified position from all layers
		 * @name me.TMXTileMap#clearTile
		 * @public
		 * @function
		 * @param {Integer} x x position 
		 * @param {Integer} y y position 
		 */
		clearTile : function(x, y) {
			// add all layers
			for ( var i = this.mapLayers.length; i--;) {
				// that are visible
				if (this.mapLayers[i] instanceof me.TMXLayer) {
					this.mapLayers[i].clearTile(x, y);
				}
			};
		}


	});
		

	/*---------------------------------------------------------*/
	// END END END
	/*---------------------------------------------------------*/
})(window);
