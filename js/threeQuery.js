var threeQuery = function() {
	var that=this,$$=that;
	this.global = {};
	this.global.camera;
	this.global.world;
	this.global.scene;
	this.global.canvasDom;
	this.global.canvasContainerDom = document.body;
	this.global.renderer;
	this.global.vrEffect;

	this.getWorldWidth = function() {
		return this.global.canvasContainerDom == document.body ? window.innerWidth : this.global.canvasContainerDom.offsetWidth;
	};

	this.getWorldHeight = function() {
		return this.global.canvasContainerDom == document.body ? window.innerHeight : this.global.canvasContainerDom.offsetHeight;
	};

	this.rightButtonEvent = function(func) {
		this.global.canvasContainerDom.oncontextmenu = function(e) {
			if(func) {
				func(e);
			}
			e.preventDefault();
		};
	};

	this.resize = function() {
		var width = this.getWorldWidth();
		var height = this.getWorldHeight();
		if(this.global.camera.type == "PerspectiveCamera") {
			this.global.camera.aspect = width / height;
			this.global.camera.updateProjectionMatrix();
		} else {
			this.global.camera.left = -width / 2;
			this.global.camera.right = width / 2;
			this.global.camera.top = height / 2;
			this.global.camera.bottom = -height / 2;
			this.global.camera.updateProjectionMatrix();
		}
		this.global.renderer.setSize(width, height);
		if(that.global.settings.vr && that.global.vrEffect) {
			this.global.vrEffect.setSize(width, height);
		}
	};
	//设置最基本的css
	this.setCommonCSS = function() {
		document.write("<style>*{margin:0;padding:0} body{overflow:hidden}</style>");
	};

	this.createScene = function(options) {
		var scene = new THREE.Scene();
		if(!this.global.scene) {
			this.global.scene = scene;
		}
		this.rayCasterEventReceivers=this.global.scene.children;
		return scene;
	};

	this.createFog = function(option, scene) {
		option = option || {
			color: 0xffffff,
			concentration: 0.01
		};
		var scene = scene || this.global.scene;
		scene.fog = new THREE.FogExp2(option.color || 0, option.concentration || 0);
		return scene.fog;
	};

	this.createRenderer = function(options) {
		options = this.extends({}, [this.global.settings.render, options]);
		var renderer = new THREE.WebGLRenderer(options);
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize(this.getWorldWidth(), this.getWorldHeight());
		if(!this.global.renderer) {
			this.global.renderer = renderer;
			this.global.canvasContainerDom.appendChild(this.global.renderer.domElement);
			if(that.global.settings.vr) {
				this.global.vrEffect = new THREE.StereoEffect(this.global.renderer);
			}
			this.global.canvasDom = this.global.renderer.domElement;
		}

		return renderer;
	};
	this.createCamera = function(options) {
		var camera;
		var options = this.extends({}, [this.global.settings.camera, options]);
		if(options.type != "OrthographicCamera") {
			camera = new THREE.PerspectiveCamera(options.fov, options.aspect, options.near, options.far);
		} else {
			camera = new THREE.OrthographicCamera(options.left, options.right, options.top, options.bottom, options.near, options.far);
		}
		if(!this.global.camera) {
			this.global.camera = camera;
		}
		return camera;
	};

	this.init = function(sceneOpt, renderOpt, cameraOpt) {
		that.setCommonCSS();
//		this.createScene(sceneOpt);
		that.createRenderer(renderOpt);
//		this.createCamera(cameraOpt);
		that.addEventListener();
		var world=new that.SubWorld(sceneOpt,cameraOpt);
		world.toMain();
		return [that.global.scene, that.global.renderer, that.global.camera];
	};
	//添加鼠标事件
	this.addEventListener = function() {
		//鼠标移动事件
		function onDocumentMouseMove(event) {
			event.preventDefault();
			that.global.mouse.x = (event.clientX / that.getWorldWidth()) * 2 - 1;
			that.global.mouse.y = -(event.clientY / that.getWorldHeight()) * 2 + 1;
			if(that.global.selectedObj && that.global.selectedObj.object.onDrag && that.global.isDown) {
				that.global.selectedObj.object.onDrag(that.global.selectedObj);
			}
		}

		function onDocumentMouseClick(event) {
			if(that.global.selectedObj && that.global.selectedObj.object.onClick && that.global.selectedObj.object.isDown == true) {
				that.global.selectedObj.object.isDown = false;
				that.global.selectedObj.object.onClick(that.global.selectedObj, event);
			}
			if(that.global.centerSelectedObj && that.global.centerSelectedObj.object.onCenterClick && that.global.centerSelectedObj.object.isCenterDown == true) {
				that.global.centerSelectedObj.object.isCenterDown = false;
				that.global.centerSelectedObj.object.onCenterClick(that.global.centerSelectedObj, event);
			}
		}

		function onMouseDownOrTouchStart(event) {
			if(event.type == "touchstart") {
				that.global.mouse.x = (event.targetTouches[0].clientX / that.getWorldWidth()) * 2 - 1;
				that.global.mouse.y = -(event.targetTouches[0].clientY / that.getWorldHeight()) * 2 + 1;
				updateMouseRaycaster(true);
			}

			that.global.isDown = true;
			if(that.global.selectedObj && that.global.selectedObj.object) {
				that.global.selectedObj.object.isDown = true;
			}
			if(that.global.selectedObj && that.global.selectedObj.object.onDown) {
				that.global.selectedObj.object.onDown(that.global.selectedObj, event);
			}

			that.global.isCenterDown = true;
			if(that.global.centerSelectedObj && that.global.centerSelectedObj.object) {
				that.global.centerSelectedObj.object.isCenterDown = true;
			}
			if(that.global.centerSelectedObj && that.global.centerSelectedObj.object.onCenterDown) {
				that.global.centerSelectedObj.object.onCenterDown(that.global.centerSelectedObj, event);
			}
		}

		function onMouseUpOrTouchEnd(event) {
			that.global.isDown = false;
			if(that.global.selectedObj && that.global.selectedObj.object.onUp && that.global.selectedObj.object.isDown == true) {
				that.global.selectedObj.object.onUp(that.global.selectedObj, event);
			}

			that.global.isCenterDown = false;
			if(that.global.centerSelectedObj && that.global.centerSelectedObj.object.onCenterUp && that.global.centerSelectedObj.object.isCenterDown == true) {
				that.global.centerSelectedObj.object.onCenterUp(that.global.centerSelectedObj, event);
			}
		}
		that.global.canvasContainerDom.addEventListener("click", onDocumentMouseClick);
		that.global.canvasContainerDom.addEventListener("mousemove", onDocumentMouseMove);
		that.global.canvasContainerDom.addEventListener("mousedown", onMouseDownOrTouchStart);
		that.global.canvasContainerDom.addEventListener("mouseup", onMouseUpOrTouchEnd);
		that.global.canvasContainerDom.addEventListener("touchstart", onMouseDownOrTouchStart);
		that.global.canvasContainerDom.addEventListener("touchend", onMouseUpOrTouchEnd);
	};

	this.sceneCoordinateToCanvasCoordinate = function(obj, scene) {
		var worldVector = obj.position.clone();
		if(scene) {
			var vector = worldVector.project(scene.camera);
		} else {
			var vector = worldVector.project(that.global.camera);
		}

		var halfWidth = that.getWorldWidth() / 2;
		var halfHeight = that.getWorldHeight() / 2;

		var result = {
			x: Math.round(vector.x * halfWidth + halfWidth),
			y: Math.round(-vector.y * halfHeight + halfHeight)
		};
		return result;
	};
	
	window.addEventListener("resize",function(){
		if(that.global.settings.resize) {
			that.resize();
		}
	},false);

	this.animate = function() {
		requestAnimationFrame(that.animate);
		if(that.global.settings.renderPause) {
			return;
		}
		that.global.renderer.setClearColor(that.global.world.clearColor, that.global.world.alpha);
		that.worldActions();
		for(var i in that.actionInjections) {
			if(that.actionInjections[i] instanceof Function == true) {
				that.actionInjections[i]();
			}
		}
		if(that.global.settings.raycaster) {
			updateRaycaster();
		}
		if(that.global.settings.vr) {
			if(!that.global.vrEffect) {
				that.global.vrEffect = new THREE.StereoEffect(that.global.renderer);
			}
			that.global.renderer.render(that.global.scene, that.global.camera);
			that.global.vrEffect.render(that.global.scene, that.global.camera);
		} else {
			that.global.renderer.render(that.global.scene, that.global.camera);
		}
		if(that.global.controls) {
			that.global.controls.update();
		}
	};
	this.actionInjections = [];
	this.worldActions = function() {};

	this.extends = function(des, src, over) {
		var res = extend(des, src, over);

		function extend(des, src, over) {
			var override = true;
			if(over === false) {
				override = false;
			}
			if(src instanceof Array) {
				for(var i = 0, len = src.length; i < len; i++)
					extend(des, src[i], override);
			}
			for(var i in src) {
				if(override || !(i in des)) {
					des[i] = src[i];
				}
			}
			return des;
		}
		for(var i in src) {
			delete res[i];
		}
		return res;
	};

	this.openFullScreen = function() {
		var container = that.global.canvasContainerDom;
		that.global.settings.isFullScreem = true;
		if(container.requestFullscreen) {
			container.requestFullscreen();
		} else if(container.msRequestFullscreen) {
			container.msRequestFullscreen();
		} else if(container.mozRequestFullScreen) {
			container.mozRequestFullScreen();
		} else if(container.webkitRequestFullscreen) {
			container.webkitRequestFullscreen();
		} else {
			that.global.settings.isFullScreem = false;
		}
		return that.global.settings.isFullScreem;
	};
	this.closeFullScreen = function() {
		var container = document;
		that.global.settings.isFullScreem = false;
		if(container.exitFullscreen) {
			container.exitFullscreen();
		} else if(container.mozCancelFullScreen) {
			container.mozCancelFullScreen();
		} else if(container.webkitExitFullScreen) {
			container.webkitExitFullScreen();
		} else if(container.msExitFullscreen) {
			container.msExitFullscreen();
		} else if(container.webkitCancelFullScreen) {
			container.webkitCancelFullScreen();
		}
		if(container.webkitExitFullScreen) {
			container.webkitCancelFullScreen();
		}
		return that.global.settings.isFullScreem;
	};
	this.toggleFullScreen = function() {
		if(that.global.settings.isFullScreem) {
			this.closeFullScreen();
		} else {
			this.openFullScreen();
		}
	};

	this.groups = {}; //添加小组，可以把不同的物体放在不同的组里。并且后续的性能优化，操作方式都会用到group。但是这个group只是把里面的物体进行分类，不进行其他任何操作
	//传入一个group的名称,每个名称的group都是个单例
	this.createGroup = function(str) {
		if(that.groups[str]) {
			return that.groups[str];
		}
		var g = new that.ThreeGroup(str);
		that.groups[str] = g;
		return g;
	};

	this.removeGroup = function(str) {
		if(that.groups[str]) {
			var arr = that.groups[str].children;
			delete that.groups[str];
			return arr;
		}
		return [];
	};
	this.global.mouse = new THREE.Vector2();
	this.global.mouse.x = NaN;
	this.global.mouse.y = NaN;
	this.global.raycaster = new THREE.Raycaster();
	this.global.centerRaycaster = new THREE.Raycaster();

	this.global.selectedObj = null;
	this.global.centerSelectedObj = null;

	this.rayCasterEventReceivers = [];

	function updateMouseRaycaster(isTouch) {
		that.global.raycaster.setFromCamera(that.global.mouse, that.global.camera);
		var intersects = that.global.raycaster.intersectObjects(that.rayCasterEventReceivers, true);

		var intersect;
		for(var i = 0; i < intersects.length; i++) {
			if(intersects[i].object.isPenetrated) {
				continue;
			} else {
				intersect = intersects[i];
				break;
			}
		}

		if(intersect) {
			if((that.global.selectedObj == null) || (that.global.selectedObj.object.uuid != intersect.object.uuid)) {
				if(that.global.selectedObj && that.global.selectedObj.object.uuid != intersect.object.uuid && !isTouch) {
					if(that.global.selectedObj.object.onLeave) {
						that.global.selectedObj.object.onLeave(that.global.selectedObj);
					}
				}
				that.global.selectedObj = intersect;
				if(that.global.selectedObj.object.onEnter && !isTouch) {
					that.global.selectedObj.object.onEnter(that.global.selectedObj);
				}
			} else {
				that.global.selectedObj = intersect;
			}
		} else {
			if(that.global.selectedObj) {
				if(that.global.selectedObj.object.onLeave) {
					that.global.selectedObj.object.onLeave(that.global.selectedObj);
				}
				that.global.selectedObj = null;
			}
		}
	}

	function updateCenterRaycaster() {
		var centerV = new THREE.Vector2(0, 0);
		that.global.centerRaycaster.setFromCamera(centerV, that.global.camera);
		var intersects = that.global.centerRaycaster.intersectObjects(that.rayCasterEventReceivers);
		var intersect;
		for(var i = 0; i < intersects.length; i++) {
			if(intersects[i].object.isPenetrated) {
				continue;
			} else {
				intersect = intersects[i];
				break;
			}
		}
		if(intersect) {
			if((that.global.centerSelectedObj == null) || (that.global.centerSelectedObj.object.uuid != intersect.object.uuid)) {
				if(that.global.centerSelectedObj && that.global.centerSelectedObj.object.uuid != intersect.object.uuid) {
					if(that.global.centerSelectedObj.object.onCenterLeave) {
						that.global.centerSelectedObj.object.onCenterLeave(that.global.centerSelectedObj);
					}
				}
				that.global.centerSelectedObj = intersect;
				if(that.global.centerSelectedObj.object.onCenterEnter) {
					that.global.centerSelectedObj.object.onCenterEnter(that.global.centerSelectedObj);
				}
			} else {
				that.global.centerSelectedObj = intersect;
			}
		} else {
			if(that.global.centerSelectedObj) {
				if(that.global.centerSelectedObj.object.onCenterLeave) {
					that.global.centerSelectedObj.object.onCenterLeave(that.global.centerSelectedObj);
				}
				that.global.centerSelectedObj = null;
			}
		}
	}

	function updateRaycaster() {
		updateMouseRaycaster();
		updateCenterRaycaster();
	}

	this.ThreeGroup = function(str) {
		this.name = str;
		this.children = [];
		this.remove = function(obj) {
			for(var i in this.children) {
				if(obj == this.children[i]) {
					this.splice(i, 1);
					return;
				}
			}
		};
		this.push = function(obj) {
			for(var i in this.children) {
				if(obj == this.children[i]) {
					return i;
				}
			}
			this.children.push(obj);
			return i;
		};
	};
	this.get = function(str, group) {
		var key = str.split('=');
		var val = key[1];
		key = key[0];
		var arr = null,
			res = [];
		if(group) {
			if(typeof group == "string") {
				arr = that.groups[group];
				if(arr) {

				} else {
					return [];
				}
			} else if(typeof group == "object") {
				arr = group.children;
			}
		} else {
			arr = that.global.scene.children;
		}
		if(arr) {
			if(key == "id") {
				for(var i = 0; i < arr.length; i++) {
					if(arr[i].id == val) {
						return arr[i];
					}
				}
			} else {
				for(var i = 0; i < arr.length; i++) {
					if(arr[i][key] == val) {
						res.push(arr[i]);
					}
				}
				return res;
			}
		}
		return [];
	};

	this.subWorlds = {
		children: {},
		getCurrentSubWorld: function() {
			for(var i in that.subWorlds.children) {
				if(that.subWorlds.children[i].isCurrent) {
					return that.subWorlds.children[i];
				}
			}
		},
		getSubWorldByName: function(name) {
			for(var i in that.subWorlds.children) {
				if(that.subWorlds.children[i].name == name) {
					return that.subWorlds.children[i];
				}
			}
		}
	};

	this.SubWorld = function(optWorld, optCamera) {
		optWorld=optWorld||{};
		optCamera=optCamera||{};
		var that=this;
		this.name = optWorld.name || "";
		this.id = $$.rndString(16);
		this.scene = new THREE.Scene();
		this.camera = "";
		this.rayCasterEventReceivers = this.scene.children;
		var options = $$.extends({}, [$$.global.settings.camera, optCamera]);
		if(options.type != "OrthographicCamera") {
			this.camera = new THREE.PerspectiveCamera(options.fov, options.aspect, options.near, options.far);
		} else {
			this.camera = new THREE.OrthographicCamera(options.left, options.right, options.top, options.bottom, options.near, options.far);
		}
		this.actionInjections = [];
		renderTargetParameters = {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat,
			stencilBuffer: false
		};
		this.clearColor = optWorld.clearColor== null ?$$.global.renderer.getClearColor():optWorld.clearColor;
		this.alpha = optWorld.alpha == null ? 1 : optWorld.alpha;
		this.fbo = new THREE.WebGLRenderTarget($$.getWorldWidth(), $$.getWorldHeight(), renderTargetParameters);
		this.isResize = optWorld.resize == null ? true : optWorld.resize;
		this.resize = function() {
			var width = $$.getWorldWidth();
			var height = $$.getWorldHeight();
			if(that.camera.type == "PerspectiveCamera") {
				that.camera.aspect = width / height;
				that.camera.updateProjectionMatrix();
			} else {
				that.camera.left = -width / 2;
				that.camera.right = width / 2;
				that.camera.top = height / 2;
				that.camera.bottom = -height / 2;
				that.camera.updateProjectionMatrix();
			}
			$$.global.renderer.setSize(width, height);
			if($$.global.settings.vr && $$.global.vrEffect) {
				$$.global.vrEffect.setSize(width, height);
			}
		};
		this.update = function(rtt) {
			$$.global.renderer.setClearColor(that.clearColor,that.alpha);
			if(that.isResize) {
				that.resize();
			}
			for(var i = 0; i < that.actionInjections.length; i++) {
				that.actionInjections[i]();
			}
			if(rtt) {
				$$.global.renderer.render(that.scene, that.camera, that.fbo, true);
				$$.global.renderer.setClearColor($$.global.world.clearColor, $$.global.world.alpha);
			} else {
				$$.global.renderer.render(that.scene, that.camera);
			}
		};
		this.updateFBO=function(){
			$$.global.renderer.setClearColor(that.clearColor,that.alpha);
			if(that.isResize) {
				that.resize();
			}
			for(var i = 0; i < that.actionInjections.length; i++) {
				that.actionInjections[i]();
			}
			$$.global.renderer.render(that.scene, that.camera, that.fbo, true);
			$$.global.renderer.setClearColor($$.global.world.clearColor, $$.global.world.alpha);
		};
		this.isCurrent = false;
		this.toTexture = function() {
			return this.fbo.texture;
		};
		this.toMain = function() {
			$$.global.world=that;
			$$.global.scene = that.scene;
			$$.global.camera = that.camera;
			$$.actionInjections = that.actionInjections;
			$$.global.renderer.setClearColor(that.clearColor, that.alpha);
			$$.global.controls = that.controls;
			$$.rayCasterEventReceivers = that.rayCasterEventReceivers;
			for(var i in $$.subWorlds) {
				if($$.subWorlds[i].isCurrent) {
					$$.subWorlds[i].isCurrent = false;
					if($$.subWorlds[i].controls) {
						$$.subWorlds[i].controls.enabledBefore = $$.subWorlds[i].controls.enabled;
						$$.subWorlds[i].controls.enabled = false;
					}
				}
			}
			this.isCurrent = true;
			if(this.controls) {
				this.controls.enabled = this.controls.enabledBefore;
			}
		};
		$$.subWorlds.children[this.id] = this;
	};

	this.Transition = function(sceneA, option, texture) {
		var makeSubWorld = function(scene, camera, injections, clearColor) {
			var subWorld = {
				scene: scene,
				camera: camera,
				actionInjections: injections
			};
			renderTargetParameters = {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				format: THREE.RGBFormat,
				stencilBuffer: false
			};
			subWorld.fbo = new THREE.WebGLRenderTarget(that.getWorldWidth(), that.getWorldHeight(), renderTargetParameters);
			subWorld.clearColor = clearColor;
			subWorld.update = function(rtt) {
				if($$.global.settings.resize) {
					var width = $$.getWorldWidth();
					var height = $$.getWorldHeight();
					if(subWorld.camera.type == "PerspectiveCamera") {
						subWorld.camera.aspect = width / height;
						subWorld.camera.updateProjectionMatrix();
					} else {
						subWorld.camera.left = -width / 2;
						subWorld.camera.right = width / 2;
						subWorld.camera.top = height / 2;
						subWorld.camera.bottom = -height / 2;
						subWorld.camera.updateProjectionMatrix();
					}
					$$.global.renderer.setSize(width, height);
				}
				$$.global.renderer.setClearColor(subWorld.clearColor);
				if(rtt)
					$$.global.renderer.render(subWorld.scene, subWorld.camera, subWorld.fbo, true);
				else {
					$$.global.renderer.render(subWorld.scene, subWorld.camera);
				}
			};
			return subWorld;
		};

		var transitionParams = that.extends({}, [{
			"useTexture": true,
			"transition": 0,
			"transitionSpeed": 10,
			"texture": 5,
			"loopTexture": true,
			"animateTransition": true,
			"textureThreshold": 0.3
		}, option]);
		var sceneB = makeSubWorld($$.global.scene, $$.global.camera, $$.actionInjections, $$.global.renderer.getClearColor().clone());

		this.scene = new THREE.Scene();
		this.cameraOrtho = that.createCamera({
			type: "OrthographicCamera",
			near: -10,
			far: 10
		});
		this.texture = texture;
		this.quadmaterial = new THREE.ShaderMaterial({
			uniforms: {
				tDiffuse1: {
					value: null
				},
				tDiffuse2: {
					value: null
				},
				mixRatio: {
					value: 0.0
				},
				threshold: {
					value: 0.1
				},
				useTexture: {
					value: 1
				},
				tMixTexture: {
					value: this.texture
				}
			},
			vertexShader: [
				"varying vec2 vUv;",
				"void main() {",
				"vUv = vec2( uv.x, uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
				"}"
			].join("\n"),
			fragmentShader: [
				"uniform float mixRatio;",
				"uniform sampler2D tDiffuse1;",
				"uniform sampler2D tDiffuse2;",
				"uniform sampler2D tMixTexture;",
				"uniform int useTexture;",
				"uniform float threshold;",
				"varying vec2 vUv;",

				"void main() {",

				"vec4 texel1 = texture2D( tDiffuse1, vUv );",
				"vec4 texel2 = texture2D( tDiffuse2, vUv );",

				"if (useTexture==1) {",

				"vec4 transitionTexel = texture2D( tMixTexture, vUv );",
				"float r = mixRatio * (1.0 + threshold * 2.0) - threshold;",
				"float mixf=clamp((transitionTexel.r - r)*(1.0/threshold), 0.0, 1.0);",

				"gl_FragColor = mix( texel1, texel2, mixf );",
				"} else {",

				"gl_FragColor = mix( texel2, texel1, mixRatio );",

				"}",
				"}"

			].join("\n")
		});

		$$.global.scene = this.scene;
		$$.global.camera = this.cameraOrtho;

		quadgeometry = new THREE.PlaneBufferGeometry($$.getWorldWidth(), $$.getWorldHeight());

		this.quad = new THREE.Mesh(quadgeometry, this.quadmaterial);
		this.scene.add(this.quad);

		this.sceneA = sceneA;
		this.sceneB = sceneB;

		this.quadmaterial.uniforms.tDiffuse1.value = sceneA.fbo.texture;
		this.quadmaterial.uniforms.tDiffuse2.value = sceneB.fbo.texture;

		this.needChange = false;

		this.setTextureThreshold = function(value) {

			this.quadmaterial.uniforms.threshold.value = value;

		};

		this.useTexture = function(value) {

			this.quadmaterial.uniforms.useTexture.value = value ? 1 : 0;

		};

		this.setTexture = function(i) {

			this.quadmaterial.uniforms.tMixTexture.value = this.texture;

		};

		this.render = function() {
			var owner = arguments.callee.owner;
			if($$.global.settings.resize) {
				var width = $$.getWorldWidth();
				var height = $$.getWorldHeight();
				owner.cameraOrtho.left = -width / 2;
				owner.cameraOrtho.right = width / 2;
				owner.cameraOrtho.top = height / 2;
				owner.cameraOrtho.bottom = -height / 2;
			}

			if(transitionParams.animateTransition) {
				transitionParams.transition += 0.001 * transitionParams.transitionSpeed;
			}
			owner.quadmaterial.uniforms.mixRatio.value = Math.min(transitionParams.transition, 1);
			if(transitionParams.transition === 0) {
				owner.sceneB.update(false);
			} else if(transitionParams.transition >= 1) {
				owner.sceneA.update(true);
				for(var i = 0; i < $$.actionInjections.length; i++) {
					if($$.actionInjections[i] == arguments.callee) {
						$$.actionInjections.splice(i, 1);
					}
				}
				owner.sceneA.toMain();

			} else {
				$$.global.renderer.setClearColor(owner.sceneB.clearColor);
				owner.sceneB.update(true);
				$$.global.renderer.setClearColor(owner.sceneA.clearColor);
				owner.sceneA.update(true);
				$$.global.renderer.render(owner.scene, owner.cameraOrtho, null, true);
			}
		};
		this.render.owner = this;
	};
	
	this.TransitionFBO = function(sceneA,sceneB,world, option, texture,onEnd) {
		var transitionParams = that.extends({}, [{
			"useTexture": true,
			"transition": 0,
			"transitionSpeed": 10,
			"texture": 5,
			"loopTexture": true,
			"animateTransition": true,
			"textureThreshold": 0.3
		}, option]);
		this.world=world;
		this.scene = world.scene;//new THREE.Scene();
		this.cameraOrtho=world.camera;
//		this.cameraOrtho = that.createCamera({
//			type: "OrthographicCamera",
//			near: -10,
//			far: 10
//		});
		this.texture = texture;
		this.quadmaterial = new THREE.ShaderMaterial({
			uniforms: {
				tDiffuse1: {
					value: null
				},
				tDiffuse2: {
					value: null
				},
				mixRatio: {
					value: 0.0
				},
				threshold: {
					value: 0.1
				},
				useTexture: {
					value: 1
				},
				tMixTexture: {
					value: this.texture
				}
			},
			vertexShader: [
				"varying vec2 vUv;",
				"void main() {",
				"vUv = vec2( uv.x, uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
				"}"
			].join("\n"),
			fragmentShader: [
				"uniform float mixRatio;",
				"uniform sampler2D tDiffuse1;",
				"uniform sampler2D tDiffuse2;",
				"uniform sampler2D tMixTexture;",
				"uniform int useTexture;",
				"uniform float threshold;",
				"varying vec2 vUv;",

				"void main() {",

				"vec4 texel1 = texture2D( tDiffuse1, vUv );",
				"vec4 texel2 = texture2D( tDiffuse2, vUv );",

				"if (useTexture==1) {",

				"vec4 transitionTexel = texture2D( tMixTexture, vUv );",
				"float r = mixRatio * (1.0 + threshold * 2.0) - threshold;",
				"float mixf=clamp((transitionTexel.r - r)*(1.0/threshold), 0.0, 1.0);",

				"gl_FragColor = mix( texel1, texel2, mixf );",
				"} else {",

				"gl_FragColor = mix( texel2, texel1, mixRatio );",

				"}",
				"}"

			].join("\n")
		});

//		$$.global.scene = this.scene;
//		$$.global.camera = this.cameraOrtho;

		quadgeometry = new THREE.PlaneBufferGeometry($$.getWorldWidth(), $$.getWorldHeight());

		this.quad = new THREE.Mesh(quadgeometry, this.quadmaterial);
		this.scene.add(this.quad);

		this.sceneA = sceneA;
		this.sceneB = sceneB;

		this.quadmaterial.uniforms.tDiffuse1.value = sceneA.fbo.texture;
		this.quadmaterial.uniforms.tDiffuse2.value = sceneB.fbo.texture;

		this.needChange = false;

		this.setTextureThreshold = function(value) {

			this.quadmaterial.uniforms.threshold.value = value;

		};

		this.useTexture = function(value) {

			this.quadmaterial.uniforms.useTexture.value = value ? 1 : 0;

		};

		this.setTexture = function(i) {

			this.quadmaterial.uniforms.tMixTexture.value = this.texture;

		};

		this.render = function() {
			var owner = arguments.callee.owner;
			if($$.global.settings.resize) {
				var width = $$.getWorldWidth();
				var height = $$.getWorldHeight();
				owner.cameraOrtho.left = -width / 2;
				owner.cameraOrtho.right = width / 2;
				owner.cameraOrtho.top = height / 2;
				owner.cameraOrtho.bottom = -height / 2;
			}

			if(transitionParams.animateTransition) {
				transitionParams.transition += 0.001 * transitionParams.transitionSpeed;
			}
			owner.quadmaterial.uniforms.mixRatio.value = Math.min(transitionParams.transition, 1);
			if(transitionParams.transition === 0) {
				owner.sceneB.update(false);
			} else if(transitionParams.transition >= 1) {
				owner.sceneA.update(true);
				for(var i = 0; i < $$.actionInjections.length; i++) {
					if($$.actionInjections[i] == arguments.callee) {
						$$.actionInjections.splice(i, 1);
					}
				}
//				owner.sceneA.toMain();
				if(onEnd){
					onEnd();
				}

			} else {
				$$.global.renderer.setClearColor(owner.sceneB.clearColor);
				owner.sceneB.updateFBO();
				$$.global.renderer.setClearColor(owner.sceneA.clearColor);
				owner.sceneA.updateFBO();
				owner.world.updateFBO();
				//$$.global.renderer.render(owner.scene, owner.cameraOrtho, null, true);
			}
		};
		this.render.owner = this;
	};

	this.rndString = function(len) {
		if(len <= 0) {
			return "";
		}
		len = len - 1 || 31;　　
		var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';　　
		var maxPos = $chars.length + 1;　　
		var pwd = $chars.charAt(Math.floor(Math.random() * (maxPos - 10)));
		for(i = 0; i < len; i++) {　　　　
			pwd += $chars.charAt(Math.floor(Math.random() * maxPos));　　
		}　　
		return pwd;
	};

	this.rndInt = function(max) {
		return Math.floor(Math.random() * max);
	};

	this.global.settings = {
		camera: {
			type: "PerspectiveCamera", //透视相機
			fov: 90, //视野广角，单位是度数
			aspect: this.getWorldWidth() / this.getWorldHeight(), //拉伸比例
			near: 1,
			far: 10000,
			left: -this.getWorldWidth() / 2, //这4个用于正交相机
			right: this.getWorldWidth() / 2,
			top: this.getWorldHeight() / 2,
			bottom: -this.getWorldHeight() / 2,
		},
		render: {
			alpha: false,
			antialias: true,
			clearColor: 0x000000,
			depth: true,
			logarithmicDepthBuffer: false,
			precision: "highp",
			premultipliedAlpha: false,
			preserveDrawingBuffer: false,
			stencil: true,
		},
		sea: {
			alpha: 1,
			color: 0x001e0f,
			width: 100000,
			height: 100000
		},
		raycaster: true, //启用射线法
		resize: true, //如果窗口大小改变则改变渲染大小
		renderPause: false, //暂停渲染循环
		vr: false, //显示VR效果,
		showLoadingProgress: false, //显示加载的进度条
		isFullScreem: false
	};
};
var $$ = new threeQuery();
$$.Loader = new(function() {
	var that = this;
	this.RESOURCE = {
		textures: {},
		models: {},
		sounds: {},
		fonts: {},
		unloadedSource: {
			textures: [],
			models: [],
			sounds: [],
			fonts: []
		}
	};
	this.loadingManager = new THREE.LoadingManager();
	this.loadingManager.onProgress = function(item, loaded, total) {
		that.onProgress(item, loaded, total);
		if(loaded == total) {
			allLoaded = true;
			if(allLoaded && soundDecodeNum == 0) {
				if(that.onLoadComplete) {
					that.onLoadComplete();
				}
			}
		}
	};
	this.onProgress = function() {};
	this.onLoadComplete = function() {};
	this.loadTexture = function(arr,onSuccess,onProgree,onError) {
		allLoaded = false;
		var loader = new THREE.TextureLoader(that.loadingManager);
		for(let i in arr) {
			loader.load(arr[i],
				function(texture) {
					that.RESOURCE.textures[arr[i]] = texture;
					if(onSuccess){
						onSuccess(texture);
					}
				},
				function(xhr) {
					if(onProgree){
						onProgree();
					}
				},
				function(xhr) {
					that.RESOURCE.unloadedSource.textures.push(arr[i]);
					if(onError){
						onError();
					}
					console.log(arr[i] + " is not found");
				}
			);
		}
	};
	this.loadCubeTexture = function(name, arr) {
		allLoaded = false;
		var loader = new THREE.CubeTextureLoader(that.loadingManager);
		loader.load(arr,
			function(texture) {
				that.RESOURCE.textures[name] = texture;
			},
			function(xhr) {},
			function(xhr) {
				that.RESOURCE.unloadedSource.textures.push(arr[i]);
				console.log(name + " is not found");
			}
		);
	};
	var soundDecodeNum = 0; //需要解码的音频数量
	var allLoaded = true;
	this.loadSound = function(arr) {
		var loader = new THREE.AudioLoader(that.loadingManager);
		for(let i in arr) {
			soundDecodeNum++;
			loader.load(arr[i],
				function(buffer) {
					that.RESOURCE.sounds[arr[i]] = buffer;
					soundDecodeNum--;
					if(allLoaded && soundDecodeNum == 0) {
						if(that.onLoadComplete) {
							that.onLoadComplete();
						}
					}
				},
				function(xhr) {},
				function(xhr) {
					that.RESOURCE.unloadedSource.sounds.push(arr[i]);
					console.log(arr[i] + " is not found");
				}
			);
		}
	};
	this.loadFont = function(arr) {
		allLoaded = false;
		var loader = new THREE.FontLoader(that.loadingManager);
		var loader2 = new THREE.TTFLoader(that.loadingManager);
		for(let i in arr) {
			var str = arr[i];
			if(str.lastIndexOf(".json") == str.length - 5) {
				loader.load(arr[i],
					function(font) {
						that.RESOURCE.fonts[arr[i]] = font;
					},
					function(xhr) {},
					function(xhr) {
						that.RESOURCE.unloadedSource.textures.push(arr[i]);
						console.log(arr[i] + " is not found");
					}
				);
			} else {
				loader2.load(arr[i],
					function(json) {
						var font = new THREE.Font(json);
						that.RESOURCE.fonts[arr[i]] = font;
					},
					function(xhr) {},
					function(xhr) {
						that.RESOURCE.unloadedSource.textures.push(arr[i]);
						console.log(arr[i] + " is not found");
					}
				);
			}
		}
	};
	this.loadText = function(name, url) {
		var loader = new THREE.FileLoader(that.loadingManager);
		loader.load(
			url,
			function(data) {
				that.RESOURCE.text[name] = data;
			},
			function(xhr) {},
			function(xhr) {
				that.RESOURCE.unloadedSource.textures.push(url);
				console.log(name + " is not found");
			}
		);
	};
});
//九宫格对齐方式：
//1 2 3
//4 5 6
//7 8 9
$$.Component = {
	drawTextImage: function(str, options) {
		var optionDefault = {
			fontSize: 30,
			fontFamily: "Courier New",
			color: "white",
			textAlign: 5, //九宫格对齐方式，5是居中
			backgroundColor: "red",
			//			backgroundImage:"",
			width: 1,
			height: 1,
			lineHeight: 30,
			x: 0,
			y: 0
		};
		var strArr = str.split("\n");

		var maxLength = 0;
		for(var i in strArr) {
			if(maxLength < strArr[i].length) {
				maxLength = strArr[i].length;
			}
		}
		var optionstmp = $$.extends({}, [optionDefault, options]);

		if(!options.width) {
			while(optionstmp.width < maxLength * optionstmp.fontSize) {
				optionstmp.width *= 2;
			}
		}
		if(!options.height) {
			var tmpheight = strArr.length * optionstmp.lineHeight;
			while(optionstmp.height < tmpheight) {
				optionstmp.height *= 2;
			}
		}

		var canvas = document.createElement("canvas");
		canvas.width = optionstmp.width;
		canvas.height = optionstmp.height;
		var ctx = canvas.getContext("2d");
		ctx.fillStyle = optionstmp.backgroundColor;
		ctx.fillRect(0, 0, optionstmp.width, optionstmp.height);
		ctx.font = optionstmp.fontSize + "px " + optionstmp.fontFamily;
		ctx.fillStyle = optionstmp.color;

		var x = 0,
			y = 0;

		for(var i in strArr) {
			ctx.fillText(strArr[i], optionstmp.x, optionstmp.y + (optionstmp.lineHeight * i + optionstmp.lineHeight));
		}
		return canvas;
	},

	//创建计时器，计时器的总时间，间隔触发事件时间
	Timer: function(options, world) {
		this.actionInjections = world ? world.actionInjections : $$.actionInjections;
		var defaultOptions = {
			id: "",
			life: 1000,
			duration: 1000,
			onStart: function() {
				console.log("timer start");
			},
			onRepeat: function() {
				console.log("repeat");
			},
			onEnd: function() {
				console.log("timer end");
			}
		};
		this.options = $$.extends({}, [defaultOptions, options]);
		this.id = options.id;
		this.life = options.life;
		this.duration = options.duration;
		this.onStart = options.onStart || function() {
			console.log("timer start");
		};
		this.onRepeat = options.onRepeat || function() {
			console.log("timer repeat");
		};
		this.onEnd = options.onEnd || function() {
			console.log("timer end");
		};
		this.lastTime;
		this.nowTime;
		this.elapsedTime = 0;
		this.durationTmp = 0;
		this.start = function() {
			this.lastTime = this.nowTime = performance.now();
			this.onStart();
			this.actionInjections.push(this.update);
		};
		let thisObj = this;
		this.update = function() {
			thisObj.lastTime = thisObj.nowTime;
			thisObj.nowTime = performance.now();
			thisObj.elapsedTime = thisObj.nowTime - thisObj.lastTime;
			thisObj.life -= thisObj.elapsedTime;

			if(thisObj.life <= 0) {
				thisObj.onEnd();
				for(var i in thisObj.actionInjections) {
					if(thisObj.update == thisObj.actionInjections[i]) {

						thisObj.actionInjections.splice(i, 1);
						break;
					}
				}
				return;
			}
			thisObj.durationTmp += thisObj.elapsedTime;
			if(thisObj.durationTmp >= thisObj.duration) {
				thisObj.durationTmp -= thisObj.duration;
				thisObj.onRepeat();
			}
		};
		this.stop = function() {
			thisObj.onEnd();
			for(var i in thisObj.actionInjections) {
				if(thisObj.update == thisObj.actionInjections[i]) {
					thisObj.actionInjections.splice(i, 1);
					break;
				}
			}
		};
	},

	//创建子弹，它会直线前进，直到生命周期到了
	createBullet: function(mesh, options) {
		var position = $$.controls.getObject().position;
		var direction = $$.global.centerRaycaster.ray.direction;
		var defOpts = {
			speed: 3,
			life: 10000,
			position: new THREE.Vector3(position.x, position.y, position.z),
			direction: new THREE.Vector3(direction.x, direction.y, direction.z)
		};
		options = $$.extends({}, [defOpts, options]);
		mesh.lookAt(options.direction);
		mesh.position.x = options.position.x;
		mesh.position.y = options.position.y;
		mesh.position.z = options.position.z;
		mesh.lifeStart = new Date().getTime();
		mesh.life = options.life;
		$$.global.scene.add(mesh);

		$$.actionInjections.push(function() {
			mesh.position.x += options.direction.x * options.speed;
			mesh.position.y += options.direction.y * options.speed;
			mesh.position.z += options.direction.z * options.speed;
			if(mesh.life <= new Date().getTime() - mesh.lifeStart) {
				$$.global.scene.remove(mesh);
				for(var i in $$.actionInjections) {
					if($$.actionInjections[i] == arguments.callee) {
						$$.actionInjections.splice(i, 1);
					}
				}
			}
		});
	},
	createSkydome: function(pic, size, world) {
		var skyGeo = new THREE.SphereGeometry(size || 1000000, 25, 25);
		var texture = $$.Loader.RESOURCE.textures[pic] || (new THREE.TextureLoader).load(pic);
		var material = new THREE.MeshBasicMaterial({
			map: texture,
		});
		var sky = new THREE.Mesh(skyGeo, material);
		sky.material.side = THREE.BackSide;
		if(world) {
			world.scene.add(sky);
		} else {
			$$.global.scene.add(sky);
		}

		return sky;
	},
	createSkybox: function(texture, width, world) {
		var cubeMap = new THREE.CubeTexture([]);
		cubeMap.format = THREE.RGBFormat;

		var loader = new THREE.ImageLoader();
		loader.load(texture, function(image) {
			var getSide = function(x, y) {

				var size = 1024;

				var canvas = document.createElement('canvas');
				canvas.width = size;
				canvas.height = size;

				var context = canvas.getContext('2d');
				context.drawImage(image, -x * size, -y * size);
				return canvas;
			};

			cubeMap.images[0] = getSide(2, 1); // px
			cubeMap.images[1] = getSide(0, 1); // nx
			cubeMap.images[2] = getSide(1, 0); // py
			cubeMap.images[3] = getSide(1, 2); // ny
			cubeMap.images[4] = getSide(1, 1); // pz
			cubeMap.images[5] = getSide(3, 1); // nz
			cubeMap.needsUpdate = true;

		});

		var cubeShader = THREE.ShaderLib.cube;
		cubeShader.uniforms.tCube.value = cubeMap;
		var skyBoxMaterial = new THREE.ShaderMaterial({
			fragmentShader: cubeShader.fragmentShader,
			vertexShader: cubeShader.vertexShader,
			uniforms: cubeShader.uniforms,
			depthWrite: false,
			side: THREE.BackSide
		});

		var skyBox = new THREE.Mesh(
			new THREE.BoxGeometry(width || 1000000, width || 1000000, width || 1000000),
			skyBoxMaterial
		);

		if(world) {
			world.scene.add(skyBox);
		} else {
			$$.global.scene.add(skyBox);
		}
		return skyBox;
	},
	createSea: function(options, world) {
		world = world || {
			scene: $$.global.scene,
			camera: $$.global.camera,
			renderer: $$.global.renderer
		};
		options = $$.extends({}, [$$.global.settings.sea, options]);
		if($$.Loader.RESOURCE.textures[options.texture]) {
			waterNormals = $$.Loader.RESOURCE.textures[options.texture];
			waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
			water = new THREE.Water($$.global.renderer, world.camera, world.scene, {
				textureWidth: waterNormals.image.width,
				textureHeight: waterNormals.image.height,
				waterNormals: waterNormals,
				alpha: options.alpha,
				waterColor: options.color,
			});

			mirrorMesh = new THREE.Mesh(
				new THREE.PlaneBufferGeometry(options.width, options.height),
				water.material
			);

			mirrorMesh.add(water);
			mirrorMesh.rotation.x = -Math.PI * 0.5;
			world.scene.add(mirrorMesh);
			water.waterMesh = mirrorMesh;
			if(world.actionInjections) {
				world.actionInjections.push(function() {
					water.material.uniforms.time.value += 1.0 / 60.0;
					water.render();
				});
			} else {
				$$.actionInjections.push(function() {
					water.material.uniforms.time.value += 1.0 / 60.0;
					water.render();
				});
			}
			return water;
		} else {
			var loader = new THREE.TextureLoader();
			loader.load(options.texture,
				function(texture) {
					$$.Loader.RESOURCE.textures[options.texture] = texture;
					waterNormals = texture;
					waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
					water = new THREE.Water($$.global.renderer, world.camera, world.scene, {
						textureWidth: waterNormals.image.width,
						textureHeight: waterNormals.image.height,
						waterNormals: waterNormals,
						alpha: options.alpha,
						waterColor: options.color,
					});

					mirrorMesh = new THREE.Mesh(
						new THREE.PlaneBufferGeometry(options.width, options.height),
						water.material
					);

					mirrorMesh.add(water);
					mirrorMesh.rotation.x = -Math.PI * 0.5;
					world.scene.add(mirrorMesh);
					water.waterMesh = mirrorMesh;
					if(world.actionInjections) {
						world.actionInjections.push(function() {
							water.material.uniforms.time.value += 1.0 / 60.0;
							water.render();
						});
					} else {
						$$.actionInjections.push(function() {
							water.material.uniforms.time.value += 1.0 / 60.0;
							water.render();
						});
					}

					return water;
				},
				function(xhr) {},
				function(xhr) {
					$$.Loader.RESOURCE.unloadedSource.textures.push(arr[i]);
					console.log(arr[i] + " is not found");
				}
			);
		}
	},
	QRCode: null
};
(function() {
	function QR8bitByte(data) {
		this.mode = QRMode.MODE_8BIT_BYTE;
		this.data = data;
		this.parsedData = [];

		// Added to support UTF-8 Characters
		for(var i = 0, l = this.data.length; i < l; i++) {
			var byteArray = [];
			var code = this.data.charCodeAt(i);

			if(code > 0x10000) {
				byteArray[0] = 0xF0 | ((code & 0x1C0000) >>> 18);
				byteArray[1] = 0x80 | ((code & 0x3F000) >>> 12);
				byteArray[2] = 0x80 | ((code & 0xFC0) >>> 6);
				byteArray[3] = 0x80 | (code & 0x3F);
			} else if(code > 0x800) {
				byteArray[0] = 0xE0 | ((code & 0xF000) >>> 12);
				byteArray[1] = 0x80 | ((code & 0xFC0) >>> 6);
				byteArray[2] = 0x80 | (code & 0x3F);
			} else if(code > 0x80) {
				byteArray[0] = 0xC0 | ((code & 0x7C0) >>> 6);
				byteArray[1] = 0x80 | (code & 0x3F);
			} else {
				byteArray[0] = code;
			}

			this.parsedData.push(byteArray);
		}

		this.parsedData = Array.prototype.concat.apply([], this.parsedData);

		if(this.parsedData.length != this.data.length) {
			this.parsedData.unshift(191);
			this.parsedData.unshift(187);
			this.parsedData.unshift(239);
		}
	}

	QR8bitByte.prototype = {
		getLength: function(buffer) {
			return this.parsedData.length;
		},
		write: function(buffer) {
			for(var i = 0, l = this.parsedData.length; i < l; i++) {
				buffer.put(this.parsedData[i], 8);
			}
		}
	};

	function QRCodeModel(typeNumber, errorCorrectLevel) {
		this.typeNumber = typeNumber;
		this.errorCorrectLevel = errorCorrectLevel;
		this.modules = null;
		this.moduleCount = 0;
		this.dataCache = null;
		this.dataList = [];
	}

	QRCodeModel.prototype = {
		addData: function(data) {
			var newData = new QR8bitByte(data);
			this.dataList.push(newData);
			this.dataCache = null;
		},
		isDark: function(row, col) {
			if(row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
				throw new Error(row + "," + col);
			}
			return this.modules[row][col];
		},
		getModuleCount: function() {
			return this.moduleCount;
		},
		make: function() {
			this.makeImpl(false, this.getBestMaskPattern());
		},
		makeImpl: function(test, maskPattern) {
			this.moduleCount = this.typeNumber * 4 + 17;
			this.modules = new Array(this.moduleCount);
			for(var row = 0; row < this.moduleCount; row++) {
				this.modules[row] = new Array(this.moduleCount);
				for(var col = 0; col < this.moduleCount; col++) {
					this.modules[row][col] = null;
				}
			}
			this.setupPositionProbePattern(0, 0);
			this.setupPositionProbePattern(this.moduleCount - 7, 0);
			this.setupPositionProbePattern(0, this.moduleCount - 7);
			this.setupPositionAdjustPattern();
			this.setupTimingPattern();
			this.setupTypeInfo(test, maskPattern);
			if(this.typeNumber >= 7) {
				this.setupTypeNumber(test);
			}
			if(this.dataCache == null) {
				this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
			}
			this.mapData(this.dataCache, maskPattern);
		},
		setupPositionProbePattern: function(row, col) {
			for(var r = -1; r <= 7; r++) {
				if(row + r <= -1 || this.moduleCount <= row + r) continue;
				for(var c = -1; c <= 7; c++) {
					if(col + c <= -1 || this.moduleCount <= col + c) continue;
					if((0 <= r && r <= 6 && (c == 0 || c == 6)) || (0 <= c && c <= 6 && (r == 0 || r == 6)) || (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
						this.modules[row + r][col + c] = true;
					} else {
						this.modules[row + r][col + c] = false;
					}
				}
			}
		},
		getBestMaskPattern: function() {
			var minLostPoint = 0;
			var pattern = 0;
			for(var i = 0; i < 8; i++) {
				this.makeImpl(true, i);
				var lostPoint = QRUtil.getLostPoint(this);
				if(i == 0 || minLostPoint > lostPoint) {
					minLostPoint = lostPoint;
					pattern = i;
				}
			}
			return pattern;
		},
		createMovieClip: function(target_mc, instance_name, depth) {
			var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
			var cs = 1;
			this.make();
			for(var row = 0; row < this.modules.length; row++) {
				var y = row * cs;
				for(var col = 0; col < this.modules[row].length; col++) {
					var x = col * cs;
					var dark = this.modules[row][col];
					if(dark) {
						qr_mc.beginFill(0, 100);
						qr_mc.moveTo(x, y);
						qr_mc.lineTo(x + cs, y);
						qr_mc.lineTo(x + cs, y + cs);
						qr_mc.lineTo(x, y + cs);
						qr_mc.endFill();
					}
				}
			}
			return qr_mc;
		},
		setupTimingPattern: function() {
			for(var r = 8; r < this.moduleCount - 8; r++) {
				if(this.modules[r][6] != null) {
					continue;
				}
				this.modules[r][6] = (r % 2 == 0);
			}
			for(var c = 8; c < this.moduleCount - 8; c++) {
				if(this.modules[6][c] != null) {
					continue;
				}
				this.modules[6][c] = (c % 2 == 0);
			}
		},
		setupPositionAdjustPattern: function() {
			var pos = QRUtil.getPatternPosition(this.typeNumber);
			for(var i = 0; i < pos.length; i++) {
				for(var j = 0; j < pos.length; j++) {
					var row = pos[i];
					var col = pos[j];
					if(this.modules[row][col] != null) {
						continue;
					}
					for(var r = -2; r <= 2; r++) {
						for(var c = -2; c <= 2; c++) {
							if(r == -2 || r == 2 || c == -2 || c == 2 || (r == 0 && c == 0)) {
								this.modules[row + r][col + c] = true;
							} else {
								this.modules[row + r][col + c] = false;
							}
						}
					}
				}
			}
		},
		setupTypeNumber: function(test) {
			var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
			for(var i = 0; i < 18; i++) {
				var mod = (!test && ((bits >> i) & 1) == 1);
				this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
			}
			for(var i = 0; i < 18; i++) {
				var mod = (!test && ((bits >> i) & 1) == 1);
				this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
			}
		},
		setupTypeInfo: function(test, maskPattern) {
			var data = (this.errorCorrectLevel << 3) | maskPattern;
			var bits = QRUtil.getBCHTypeInfo(data);
			for(var i = 0; i < 15; i++) {
				var mod = (!test && ((bits >> i) & 1) == 1);
				if(i < 6) {
					this.modules[i][8] = mod;
				} else if(i < 8) {
					this.modules[i + 1][8] = mod;
				} else {
					this.modules[this.moduleCount - 15 + i][8] = mod;
				}
			}
			for(var i = 0; i < 15; i++) {
				var mod = (!test && ((bits >> i) & 1) == 1);
				if(i < 8) {
					this.modules[8][this.moduleCount - i - 1] = mod;
				} else if(i < 9) {
					this.modules[8][15 - i - 1 + 1] = mod;
				} else {
					this.modules[8][15 - i - 1] = mod;
				}
			}
			this.modules[this.moduleCount - 8][8] = (!test);
		},
		mapData: function(data, maskPattern) {
			var inc = -1;
			var row = this.moduleCount - 1;
			var bitIndex = 7;
			var byteIndex = 0;
			for(var col = this.moduleCount - 1; col > 0; col -= 2) {
				if(col == 6) col--;
				while(true) {
					for(var c = 0; c < 2; c++) {
						if(this.modules[row][col - c] == null) {
							var dark = false;
							if(byteIndex < data.length) {
								dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
							}
							var mask = QRUtil.getMask(maskPattern, row, col - c);
							if(mask) {
								dark = !dark;
							}
							this.modules[row][col - c] = dark;
							bitIndex--;
							if(bitIndex == -1) {
								byteIndex++;
								bitIndex = 7;
							}
						}
					}
					row += inc;
					if(row < 0 || this.moduleCount <= row) {
						row -= inc;
						inc = -inc;
						break;
					}
				}
			}
		}
	};
	QRCodeModel.PAD0 = 0xEC;
	QRCodeModel.PAD1 = 0x11;
	QRCodeModel.createData = function(typeNumber, errorCorrectLevel, dataList) {
		var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
		var buffer = new QRBitBuffer();
		for(var i = 0; i < dataList.length; i++) {
			var data = dataList[i];
			buffer.put(data.mode, 4);
			buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
			data.write(buffer);
		}
		var totalDataCount = 0;
		for(var i = 0; i < rsBlocks.length; i++) {
			totalDataCount += rsBlocks[i].dataCount;
		}
		if(buffer.getLengthInBits() > totalDataCount * 8) {
			throw new Error("code length overflow. (" +
				buffer.getLengthInBits() +
				">" +
				totalDataCount * 8 +
				")");
		}
		if(buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
			buffer.put(0, 4);
		}
		while(buffer.getLengthInBits() % 8 != 0) {
			buffer.putBit(false);
		}
		while(true) {
			if(buffer.getLengthInBits() >= totalDataCount * 8) {
				break;
			}
			buffer.put(QRCodeModel.PAD0, 8);
			if(buffer.getLengthInBits() >= totalDataCount * 8) {
				break;
			}
			buffer.put(QRCodeModel.PAD1, 8);
		}
		return QRCodeModel.createBytes(buffer, rsBlocks);
	};
	QRCodeModel.createBytes = function(buffer, rsBlocks) {
		var offset = 0;
		var maxDcCount = 0;
		var maxEcCount = 0;
		var dcdata = new Array(rsBlocks.length);
		var ecdata = new Array(rsBlocks.length);
		for(var r = 0; r < rsBlocks.length; r++) {
			var dcCount = rsBlocks[r].dataCount;
			var ecCount = rsBlocks[r].totalCount - dcCount;
			maxDcCount = Math.max(maxDcCount, dcCount);
			maxEcCount = Math.max(maxEcCount, ecCount);
			dcdata[r] = new Array(dcCount);
			for(var i = 0; i < dcdata[r].length; i++) {
				dcdata[r][i] = 0xff & buffer.buffer[i + offset];
			}
			offset += dcCount;
			var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
			var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
			var modPoly = rawPoly.mod(rsPoly);
			ecdata[r] = new Array(rsPoly.getLength() - 1);
			for(var i = 0; i < ecdata[r].length; i++) {
				var modIndex = i + modPoly.getLength() - ecdata[r].length;
				ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
			}
		}
		var totalCodeCount = 0;
		for(var i = 0; i < rsBlocks.length; i++) {
			totalCodeCount += rsBlocks[i].totalCount;
		}
		var data = new Array(totalCodeCount);
		var index = 0;
		for(var i = 0; i < maxDcCount; i++) {
			for(var r = 0; r < rsBlocks.length; r++) {
				if(i < dcdata[r].length) {
					data[index++] = dcdata[r][i];
				}
			}
		}
		for(var i = 0; i < maxEcCount; i++) {
			for(var r = 0; r < rsBlocks.length; r++) {
				if(i < ecdata[r].length) {
					data[index++] = ecdata[r][i];
				}
			}
		}
		return data;
	};
	var QRMode = {
		MODE_NUMBER: 1 << 0,
		MODE_ALPHA_NUM: 1 << 1,
		MODE_8BIT_BYTE: 1 << 2,
		MODE_KANJI: 1 << 3
	};
	var QRErrorCorrectLevel = {
		L: 1,
		M: 0,
		Q: 3,
		H: 2
	};
	var QRMaskPattern = {
		PATTERN000: 0,
		PATTERN001: 1,
		PATTERN010: 2,
		PATTERN011: 3,
		PATTERN100: 4,
		PATTERN101: 5,
		PATTERN110: 6,
		PATTERN111: 7
	};
	var QRUtil = {
		PATTERN_POSITION_TABLE: [
			[],
			[6, 18],
			[6, 22],
			[6, 26],
			[6, 30],
			[6, 34],
			[6, 22, 38],
			[6, 24, 42],
			[6, 26, 46],
			[6, 28, 50],
			[6, 30, 54],
			[6, 32, 58],
			[6, 34, 62],
			[6, 26, 46, 66],
			[6, 26, 48, 70],
			[6, 26, 50, 74],
			[6, 30, 54, 78],
			[6, 30, 56, 82],
			[6, 30, 58, 86],
			[6, 34, 62, 90],
			[6, 28, 50, 72, 94],
			[6, 26, 50, 74, 98],
			[6, 30, 54, 78, 102],
			[6, 28, 54, 80, 106],
			[6, 32, 58, 84, 110],
			[6, 30, 58, 86, 114],
			[6, 34, 62, 90, 118],
			[6, 26, 50, 74, 98, 122],
			[6, 30, 54, 78, 102, 126],
			[6, 26, 52, 78, 104, 130],
			[6, 30, 56, 82, 108, 134],
			[6, 34, 60, 86, 112, 138],
			[6, 30, 58, 86, 114, 142],
			[6, 34, 62, 90, 118, 146],
			[6, 30, 54, 78, 102, 126, 150],
			[6, 24, 50, 76, 102, 128, 154],
			[6, 28, 54, 80, 106, 132, 158],
			[6, 32, 58, 84, 110, 136, 162],
			[6, 26, 54, 82, 110, 138, 166],
			[6, 30, 58, 86, 114, 142, 170]
		],
		G15: (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
		G18: (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
		G15_MASK: (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1),
		getBCHTypeInfo: function(data) {
			var d = data << 10;
			while(QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
				d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15)));
			}
			return((data << 10) | d) ^ QRUtil.G15_MASK;
		},
		getBCHTypeNumber: function(data) {
			var d = data << 12;
			while(QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
				d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18)));
			}
			return(data << 12) | d;
		},
		getBCHDigit: function(data) {
			var digit = 0;
			while(data != 0) {
				digit++;
				data >>>= 1;
			}
			return digit;
		},
		getPatternPosition: function(typeNumber) {
			return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
		},
		getMask: function(maskPattern, i, j) {
			switch(maskPattern) {
				case QRMaskPattern.PATTERN000:
					return(i + j) % 2 == 0;
				case QRMaskPattern.PATTERN001:
					return i % 2 == 0;
				case QRMaskPattern.PATTERN010:
					return j % 3 == 0;
				case QRMaskPattern.PATTERN011:
					return(i + j) % 3 == 0;
				case QRMaskPattern.PATTERN100:
					return(Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
				case QRMaskPattern.PATTERN101:
					return(i * j) % 2 + (i * j) % 3 == 0;
				case QRMaskPattern.PATTERN110:
					return((i * j) % 2 + (i * j) % 3) % 2 == 0;
				case QRMaskPattern.PATTERN111:
					return((i * j) % 3 + (i + j) % 2) % 2 == 0;
				default:
					throw new Error("bad maskPattern:" + maskPattern);
			}
		},
		getErrorCorrectPolynomial: function(errorCorrectLength) {
			var a = new QRPolynomial([1], 0);
			for(var i = 0; i < errorCorrectLength; i++) {
				a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
			}
			return a;
		},
		getLengthInBits: function(mode, type) {
			if(1 <= type && type < 10) {
				switch(mode) {
					case QRMode.MODE_NUMBER:
						return 10;
					case QRMode.MODE_ALPHA_NUM:
						return 9;
					case QRMode.MODE_8BIT_BYTE:
						return 8;
					case QRMode.MODE_KANJI:
						return 8;
					default:
						throw new Error("mode:" + mode);
				}
			} else if(type < 27) {
				switch(mode) {
					case QRMode.MODE_NUMBER:
						return 12;
					case QRMode.MODE_ALPHA_NUM:
						return 11;
					case QRMode.MODE_8BIT_BYTE:
						return 16;
					case QRMode.MODE_KANJI:
						return 10;
					default:
						throw new Error("mode:" + mode);
				}
			} else if(type < 41) {
				switch(mode) {
					case QRMode.MODE_NUMBER:
						return 14;
					case QRMode.MODE_ALPHA_NUM:
						return 13;
					case QRMode.MODE_8BIT_BYTE:
						return 16;
					case QRMode.MODE_KANJI:
						return 12;
					default:
						throw new Error("mode:" + mode);
				}
			} else {
				throw new Error("type:" + type);
			}
		},
		getLostPoint: function(qrCode) {
			var moduleCount = qrCode.getModuleCount();
			var lostPoint = 0;
			for(var row = 0; row < moduleCount; row++) {
				for(var col = 0; col < moduleCount; col++) {
					var sameCount = 0;
					var dark = qrCode.isDark(row, col);
					for(var r = -1; r <= 1; r++) {
						if(row + r < 0 || moduleCount <= row + r) {
							continue;
						}
						for(var c = -1; c <= 1; c++) {
							if(col + c < 0 || moduleCount <= col + c) {
								continue;
							}
							if(r == 0 && c == 0) {
								continue;
							}
							if(dark == qrCode.isDark(row + r, col + c)) {
								sameCount++;
							}
						}
					}
					if(sameCount > 5) {
						lostPoint += (3 + sameCount - 5);
					}
				}
			}
			for(var row = 0; row < moduleCount - 1; row++) {
				for(var col = 0; col < moduleCount - 1; col++) {
					var count = 0;
					if(qrCode.isDark(row, col)) count++;
					if(qrCode.isDark(row + 1, col)) count++;
					if(qrCode.isDark(row, col + 1)) count++;
					if(qrCode.isDark(row + 1, col + 1)) count++;
					if(count == 0 || count == 4) {
						lostPoint += 3;
					}
				}
			}
			for(var row = 0; row < moduleCount; row++) {
				for(var col = 0; col < moduleCount - 6; col++) {
					if(qrCode.isDark(row, col) && !qrCode.isDark(row, col + 1) && qrCode.isDark(row, col + 2) && qrCode.isDark(row, col + 3) && qrCode.isDark(row, col + 4) && !qrCode.isDark(row, col + 5) && qrCode.isDark(row, col + 6)) {
						lostPoint += 40;
					}
				}
			}
			for(var col = 0; col < moduleCount; col++) {
				for(var row = 0; row < moduleCount - 6; row++) {
					if(qrCode.isDark(row, col) && !qrCode.isDark(row + 1, col) && qrCode.isDark(row + 2, col) && qrCode.isDark(row + 3, col) && qrCode.isDark(row + 4, col) && !qrCode.isDark(row + 5, col) && qrCode.isDark(row + 6, col)) {
						lostPoint += 40;
					}
				}
			}
			var darkCount = 0;
			for(var col = 0; col < moduleCount; col++) {
				for(var row = 0; row < moduleCount; row++) {
					if(qrCode.isDark(row, col)) {
						darkCount++;
					}
				}
			}
			var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
			lostPoint += ratio * 10;
			return lostPoint;
		}
	};
	var QRMath = {
		glog: function(n) {
			if(n < 1) {
				throw new Error("glog(" + n + ")");
			}
			return QRMath.LOG_TABLE[n];
		},
		gexp: function(n) {
			while(n < 0) {
				n += 255;
			}
			while(n >= 256) {
				n -= 255;
			}
			return QRMath.EXP_TABLE[n];
		},
		EXP_TABLE: new Array(256),
		LOG_TABLE: new Array(256)
	};
	for(var i = 0; i < 8; i++) {
		QRMath.EXP_TABLE[i] = 1 << i;
	}
	for(var i = 8; i < 256; i++) {
		QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
	}
	for(var i = 0; i < 255; i++) {
		QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
	}

	function QRPolynomial(num, shift) {
		if(num.length == undefined) {
			throw new Error(num.length + "/" + shift);
		}
		var offset = 0;
		while(offset < num.length && num[offset] == 0) {
			offset++;
		}
		this.num = new Array(num.length - offset + shift);
		for(var i = 0; i < num.length - offset; i++) {
			this.num[i] = num[i + offset];
		}
	}
	QRPolynomial.prototype = {
		get: function(index) {
			return this.num[index];
		},
		getLength: function() {
			return this.num.length;
		},
		multiply: function(e) {
			var num = new Array(this.getLength() + e.getLength() - 1);
			for(var i = 0; i < this.getLength(); i++) {
				for(var j = 0; j < e.getLength(); j++) {
					num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
				}
			}
			return new QRPolynomial(num, 0);
		},
		mod: function(e) {
			if(this.getLength() - e.getLength() < 0) {
				return this;
			}
			var ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
			var num = new Array(this.getLength());
			for(var i = 0; i < this.getLength(); i++) {
				num[i] = this.get(i);
			}
			for(var i = 0; i < e.getLength(); i++) {
				num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
			}
			return new QRPolynomial(num, 0).mod(e);
		}
	};

	function QRRSBlock(totalCount, dataCount) {
		this.totalCount = totalCount;
		this.dataCount = dataCount;
	}
	QRRSBlock.RS_BLOCK_TABLE = [
		[1, 26, 19],
		[1, 26, 16],
		[1, 26, 13],
		[1, 26, 9],
		[1, 44, 34],
		[1, 44, 28],
		[1, 44, 22],
		[1, 44, 16],
		[1, 70, 55],
		[1, 70, 44],
		[2, 35, 17],
		[2, 35, 13],
		[1, 100, 80],
		[2, 50, 32],
		[2, 50, 24],
		[4, 25, 9],
		[1, 134, 108],
		[2, 67, 43],
		[2, 33, 15, 2, 34, 16],
		[2, 33, 11, 2, 34, 12],
		[2, 86, 68],
		[4, 43, 27],
		[4, 43, 19],
		[4, 43, 15],
		[2, 98, 78],
		[4, 49, 31],
		[2, 32, 14, 4, 33, 15],
		[4, 39, 13, 1, 40, 14],
		[2, 121, 97],
		[2, 60, 38, 2, 61, 39],
		[4, 40, 18, 2, 41, 19],
		[4, 40, 14, 2, 41, 15],
		[2, 146, 116],
		[3, 58, 36, 2, 59, 37],
		[4, 36, 16, 4, 37, 17],
		[4, 36, 12, 4, 37, 13],
		[2, 86, 68, 2, 87, 69],
		[4, 69, 43, 1, 70, 44],
		[6, 43, 19, 2, 44, 20],
		[6, 43, 15, 2, 44, 16],
		[4, 101, 81],
		[1, 80, 50, 4, 81, 51],
		[4, 50, 22, 4, 51, 23],
		[3, 36, 12, 8, 37, 13],
		[2, 116, 92, 2, 117, 93],
		[6, 58, 36, 2, 59, 37],
		[4, 46, 20, 6, 47, 21],
		[7, 42, 14, 4, 43, 15],
		[4, 133, 107],
		[8, 59, 37, 1, 60, 38],
		[8, 44, 20, 4, 45, 21],
		[12, 33, 11, 4, 34, 12],
		[3, 145, 115, 1, 146, 116],
		[4, 64, 40, 5, 65, 41],
		[11, 36, 16, 5, 37, 17],
		[11, 36, 12, 5, 37, 13],
		[5, 109, 87, 1, 110, 88],
		[5, 65, 41, 5, 66, 42],
		[5, 54, 24, 7, 55, 25],
		[11, 36, 12],
		[5, 122, 98, 1, 123, 99],
		[7, 73, 45, 3, 74, 46],
		[15, 43, 19, 2, 44, 20],
		[3, 45, 15, 13, 46, 16],
		[1, 135, 107, 5, 136, 108],
		[10, 74, 46, 1, 75, 47],
		[1, 50, 22, 15, 51, 23],
		[2, 42, 14, 17, 43, 15],
		[5, 150, 120, 1, 151, 121],
		[9, 69, 43, 4, 70, 44],
		[17, 50, 22, 1, 51, 23],
		[2, 42, 14, 19, 43, 15],
		[3, 141, 113, 4, 142, 114],
		[3, 70, 44, 11, 71, 45],
		[17, 47, 21, 4, 48, 22],
		[9, 39, 13, 16, 40, 14],
		[3, 135, 107, 5, 136, 108],
		[3, 67, 41, 13, 68, 42],
		[15, 54, 24, 5, 55, 25],
		[15, 43, 15, 10, 44, 16],
		[4, 144, 116, 4, 145, 117],
		[17, 68, 42],
		[17, 50, 22, 6, 51, 23],
		[19, 46, 16, 6, 47, 17],
		[2, 139, 111, 7, 140, 112],
		[17, 74, 46],
		[7, 54, 24, 16, 55, 25],
		[34, 37, 13],
		[4, 151, 121, 5, 152, 122],
		[4, 75, 47, 14, 76, 48],
		[11, 54, 24, 14, 55, 25],
		[16, 45, 15, 14, 46, 16],
		[6, 147, 117, 4, 148, 118],
		[6, 73, 45, 14, 74, 46],
		[11, 54, 24, 16, 55, 25],
		[30, 46, 16, 2, 47, 17],
		[8, 132, 106, 4, 133, 107],
		[8, 75, 47, 13, 76, 48],
		[7, 54, 24, 22, 55, 25],
		[22, 45, 15, 13, 46, 16],
		[10, 142, 114, 2, 143, 115],
		[19, 74, 46, 4, 75, 47],
		[28, 50, 22, 6, 51, 23],
		[33, 46, 16, 4, 47, 17],
		[8, 152, 122, 4, 153, 123],
		[22, 73, 45, 3, 74, 46],
		[8, 53, 23, 26, 54, 24],
		[12, 45, 15, 28, 46, 16],
		[3, 147, 117, 10, 148, 118],
		[3, 73, 45, 23, 74, 46],
		[4, 54, 24, 31, 55, 25],
		[11, 45, 15, 31, 46, 16],
		[7, 146, 116, 7, 147, 117],
		[21, 73, 45, 7, 74, 46],
		[1, 53, 23, 37, 54, 24],
		[19, 45, 15, 26, 46, 16],
		[5, 145, 115, 10, 146, 116],
		[19, 75, 47, 10, 76, 48],
		[15, 54, 24, 25, 55, 25],
		[23, 45, 15, 25, 46, 16],
		[13, 145, 115, 3, 146, 116],
		[2, 74, 46, 29, 75, 47],
		[42, 54, 24, 1, 55, 25],
		[23, 45, 15, 28, 46, 16],
		[17, 145, 115],
		[10, 74, 46, 23, 75, 47],
		[10, 54, 24, 35, 55, 25],
		[19, 45, 15, 35, 46, 16],
		[17, 145, 115, 1, 146, 116],
		[14, 74, 46, 21, 75, 47],
		[29, 54, 24, 19, 55, 25],
		[11, 45, 15, 46, 46, 16],
		[13, 145, 115, 6, 146, 116],
		[14, 74, 46, 23, 75, 47],
		[44, 54, 24, 7, 55, 25],
		[59, 46, 16, 1, 47, 17],
		[12, 151, 121, 7, 152, 122],
		[12, 75, 47, 26, 76, 48],
		[39, 54, 24, 14, 55, 25],
		[22, 45, 15, 41, 46, 16],
		[6, 151, 121, 14, 152, 122],
		[6, 75, 47, 34, 76, 48],
		[46, 54, 24, 10, 55, 25],
		[2, 45, 15, 64, 46, 16],
		[17, 152, 122, 4, 153, 123],
		[29, 74, 46, 14, 75, 47],
		[49, 54, 24, 10, 55, 25],
		[24, 45, 15, 46, 46, 16],
		[4, 152, 122, 18, 153, 123],
		[13, 74, 46, 32, 75, 47],
		[48, 54, 24, 14, 55, 25],
		[42, 45, 15, 32, 46, 16],
		[20, 147, 117, 4, 148, 118],
		[40, 75, 47, 7, 76, 48],
		[43, 54, 24, 22, 55, 25],
		[10, 45, 15, 67, 46, 16],
		[19, 148, 118, 6, 149, 119],
		[18, 75, 47, 31, 76, 48],
		[34, 54, 24, 34, 55, 25],
		[20, 45, 15, 61, 46, 16]
	];
	QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {
		var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
		if(rsBlock == undefined) {
			throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
		}
		var length = rsBlock.length / 3;
		var list = [];
		for(var i = 0; i < length; i++) {
			var count = rsBlock[i * 3 + 0];
			var totalCount = rsBlock[i * 3 + 1];
			var dataCount = rsBlock[i * 3 + 2];
			for(var j = 0; j < count; j++) {
				list.push(new QRRSBlock(totalCount, dataCount));
			}
		}
		return list;
	};
	QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectLevel) {
		switch(errorCorrectLevel) {
			case QRErrorCorrectLevel.L:
				return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
			case QRErrorCorrectLevel.M:
				return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
			case QRErrorCorrectLevel.Q:
				return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
			case QRErrorCorrectLevel.H:
				return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
			default:
				return undefined;
		}
	};

	function QRBitBuffer() {
		this.buffer = [];
		this.length = 0;
	}
	QRBitBuffer.prototype = {
		get: function(index) {
			var bufIndex = Math.floor(index / 8);
			return((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) == 1;
		},
		put: function(num, length) {
			for(var i = 0; i < length; i++) {
				this.putBit(((num >>> (length - i - 1)) & 1) == 1);
			}
		},
		getLengthInBits: function() {
			return this.length;
		},
		putBit: function(bit) {
			var bufIndex = Math.floor(this.length / 8);
			if(this.buffer.length <= bufIndex) {
				this.buffer.push(0);
			}
			if(bit) {
				this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
			}
			this.length++;
		}
	};
	var QRCodeLimitLength = [
		[17, 14, 11, 7],
		[32, 26, 20, 14],
		[53, 42, 32, 24],
		[78, 62, 46, 34],
		[106, 84, 60, 44],
		[134, 106, 74, 58],
		[154, 122, 86, 64],
		[192, 152, 108, 84],
		[230, 180, 130, 98],
		[271, 213, 151, 119],
		[321, 251, 177, 137],
		[367, 287, 203, 155],
		[425, 331, 241, 177],
		[458, 362, 258, 194],
		[520, 412, 292, 220],
		[586, 450, 322, 250],
		[644, 504, 364, 280],
		[718, 560, 394, 310],
		[792, 624, 442, 338],
		[858, 666, 482, 382],
		[929, 711, 509, 403],
		[1003, 779, 565, 439],
		[1091, 857, 611, 461],
		[1171, 911, 661, 511],
		[1273, 997, 715, 535],
		[1367, 1059, 751, 593],
		[1465, 1125, 805, 625],
		[1528, 1190, 868, 658],
		[1628, 1264, 908, 698],
		[1732, 1370, 982, 742],
		[1840, 1452, 1030, 790],
		[1952, 1538, 1112, 842],
		[2068, 1628, 1168, 898],
		[2188, 1722, 1228, 958],
		[2303, 1809, 1283, 983],
		[2431, 1911, 1351, 1051],
		[2563, 1989, 1423, 1093],
		[2699, 2099, 1499, 1139],
		[2809, 2213, 1579, 1219],
		[2953, 2331, 1663, 1273]
	];

	/**
	 * Get the type by string length
	 * 
	 * @private
	 * @param {String} sText
	 * @param {Number} nCorrectLevel
	 * @return {Number} type
	 */
	function _getTypeNumber(sText, nCorrectLevel) {
		var nType = 1;
		var length = _getUTF8Length(sText);

		for(var i = 0, len = QRCodeLimitLength.length; i <= len; i++) {
			var nLimit = 0;

			switch(nCorrectLevel) {
				case QRErrorCorrectLevel.L:
					nLimit = QRCodeLimitLength[i][0];
					break;
				case QRErrorCorrectLevel.M:
					nLimit = QRCodeLimitLength[i][1];
					break;
				case QRErrorCorrectLevel.Q:
					nLimit = QRCodeLimitLength[i][2];
					break;
				case QRErrorCorrectLevel.H:
					nLimit = QRCodeLimitLength[i][3];
					break;
			}

			if(length <= nLimit) {
				break;
			} else {
				nType++;
			}
		}

		if(nType > QRCodeLimitLength.length) {
			throw new Error("Too long data");
		}

		return nType;
	}

	function _getUTF8Length(sText) {
		var replacedText = encodeURI(sText).toString().replace(/\%[0-9a-fA-F]{2}/g, 'a');
		return replacedText.length + (replacedText.length != sText ? 3 : 0);
	}
	$$.Component.QRCode = function(str) {
		this._htOption = {
			correctLevel: QRErrorCorrectLevel.H
		};
		if(str) {
			this.makeCode(str);
		}
	};

	/**
	 * Make the QRCode
	 * 
	 * @param {String} sText link data
	 */
	$$.Component.QRCode.prototype.makeCode = function(sText) {
		this._oQRCode = new QRCodeModel(_getTypeNumber(sText, this._htOption.correctLevel), this._htOption.correctLevel);
		this._oQRCode.addData(sText);
		this._oQRCode.make();
	};

	/**
	 * @name QRCode.CorrectLevel
	 */
	$$.Component.QRCode.CorrectLevel = QRErrorCorrectLevel;
})();
$$.Controls = {
	createOrbitControls: function(options,world) {
		options=options?options:{};
		options=$$.extends({},[{
			noZoom:false,
			noPan:true,
			rotateUp:0,
			minDistance:0,
			maxDistance:Infinity,
			zoomSpeed : 1.0,
			noRotate : false,
  			rotateSpeed : 1.0,
  			keyPanSpeed:7.0,
  			autoRotate : false,
  			autoRotateSpeed :2.0,
  			minPolarAngle : 0,
  			maxPolarAngle : Math.PI,
		},options]);
		var camera = world?world.camera:$$.global.camera;
		var element = $$.global.canvasDom;
		var controls = new THREE.OrbitControls(camera, options.dom||element);
		controls.rotateUp=options.rotateUp;
		controls.target.set(
			camera.position.x + 0.1,
			camera.position.y,
			camera.position.z
		);
		controls.noZoom = options.noZoom;
		controls.noPan = options.noPan;
		controls.minDistance=options.minDistance;
		controls.maxDistance=options.maxDistance;
		controls.zoomSpeed=options.zoomSpeed;
		controls.noRotate=options.noRotate;
		controls.rotateSpeed=options.rotateSpeed;
		controls.keyPanSpeed=options.keyPanSpeed;
		controls.autoRotate=options.autoRotate;
		controls.autoRotateSpeed=options.autoRotateSpeed;
		controls.minPolarAngle=options.minPolarAngle;
		controls.maxPolarAngle=options.maxPolarAngle;
		if(world) {
			world.controls = controls;
			world.controls.enabledBefore=controls.enabled;
		} else {
			$$.global.controls = controls;
		}
		return controls;
	},
	createTrackBallControls: function(options, world) {
		if(!options) {
			options = {};
		}
		var camera = world ? world.camera : $$.global.camera;
		//		var scene = $$.global.world;
		controls = new THREE.TrackballControls(camera,options.dom||$$.global.canvasDom);
		controls.rotateSpeed = options.rotateSpeed || 1;
		controls.minDistance = options.minDistance || 1000;
		controls.maxDistance = options.maxDistance || 1000;
		controls.zoomSpeed = options.zoomSpeed || 1;
		controls.panSpeed = options.panSpeed || 1;
		controls.noZoom = options.noZoom || false;
		controls.noPan = options.noPan || false;
		controls.enabled = options.enabled == null ? true : options.enabled;
		controls.dynamicDampingFactor = options.dynamicDampingFactor || 0.3;
		controls.staticMoving = options.staticMoving || false;
		if(world) {
			world.controls = controls;
			world.controls.enabledBefore=controls.enabled;
		} else {
			$$.global.controls = controls;
		}

		return controls;
	},
	createDeviceOrientationControls: function() {
		var controls = new THREE.DeviceOrientationControls($$.global.camera, true);
		controls.connect();
		controls.update();
		//window.removeEventListener('deviceorientation', $$.Controls.createDeviceOrientationControls, true);
		//window.addEventListener('deviceorientation', $$.Controls.createDeviceOrientationControls, true);
		$$.global.controls = controls;
		return controls;
	},
	createPointerLockControls: function() {
		var controls = new THREE.PointerLockControls($$.global.camera);
		$$.global.controls = controls;
		scene.add(controls.getObject());
		controls.controlsEnabled = true;
		controls.enabled = true;
		controls.update = function() {

		};
		return controls;
	},
	createFirstCharacterControls: function(options, blocker) {
		if(options){
			if(options.speed){
				options.speed.x=options.speed.x!=null?options.speed.x:1;
				options.speed.z=options.speed.z!=null?options.speed.z:1;
				options.speed.y=options.speed.y!=null?options.speed.y:200;
			}else{
				options.speed=new THREE.Vector3(100,200,100);
			}
			options.gravity=options.gravity!=null?options.gravity:10;
			options.tall=options.tall!=null?options.tall:10;
			if(options.acceleration){
				options.acceleration.x=options.acceleration.x!=null?options.acceleration.x:1;
				options.acceleration.z=options.acceleration.z!=null?options.acceleration.z:1;
			}else{
				options.acceleration=new THREE.Vector3(1,0,1);
			}
		}
		
		var controls = new THREE.PointerLockControls($$.global.camera);
		$$.global.controls = controls;
		scene.add(controls.getObject());

		var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
		if(havePointerLock) {
			var element = document.body;
			var pointerlockchange = function(event) {
				if(document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
					controls.controlsEnabled = true;
					controls.enabled = true;
					blocker.style.display = 'none';
				} else {
					controls.enabled = false;
					blocker.style.display = '-webkit-box';
					blocker.style.display = '-moz-box';
					blocker.style.display = 'box';
				}
			};
			var pointerlockerror = function(event) {
				blocker.style.display = '-webkit-box';
				blocker.style.display = '-moz-box';
				blocker.style.display = 'box';
			};
			// Hook pointer lock state change events
			document.addEventListener('pointerlockchange', pointerlockchange, false);
			document.addEventListener('mozpointerlockchange', pointerlockchange, false);
			document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
			document.addEventListener('pointerlockerror', pointerlockerror, false);
			document.addEventListener('mozpointerlockerror', pointerlockerror, false);
			document.addEventListener('webkitpointerlockerror', pointerlockerror, false);
			blocker.addEventListener('click', function(event) {
				blocker.style.display = 'none';
				// Ask the browser to lock the pointer
				element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
				if(/Firefox/i.test(navigator.userAgent)) {
					var fullscreenchange = function(event) {
						if(document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
							document.removeEventListener('fullscreenchange', fullscreenchange);
							document.removeEventListener('mozfullscreenchange', fullscreenchange);
							element.requestPointerLock();
						}
					};
					document.addEventListener('fullscreenchange', fullscreenchange, false);
					document.addEventListener('mozfullscreenchange', fullscreenchange, false);
					element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
					element.requestFullscreen();
				} else {
					element.requestPointerLock();
				}
			}, false);
		} else {
			blocker.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
		}
		//移动模块
		controls.controlsEnabled = false;
		controls.moveForward = false;
		controls.moveBackward = false;
		controls.moveLeft = false;
		controls.moveRight = false;
		controls.canJump = true;
		controls.prevTime = performance.now();
		controls.velocity = new THREE.Vector3(0,0,0);
		//是否使用键盘控制移动
		if(options && options.keymove) {
			document.addEventListener('keydown', function(event) {
				switch(event.keyCode) {
					case 38: // up
					case 87: // w
						$$.global.controls.moveForward = true;
						break;
					case 37: // left
					case 65: // a
						$$.global.controls.moveLeft = true;
						break;
					case 40: // down
					case 83: // s
						$$.global.controls.moveBackward = true;
						break;
					case 39: // right
					case 68: // d
						$$.global.controls.moveRight = true;
						break;
					case 32: // space
						
						if($$.global.controls.canJump === true){$$.global.controls.velocity.y += options.speed.y};
						$$.global.controls.canJump = false;
						break;
				}
			}, false);
			document.addEventListener('keyup', function(event) {
				switch(event.keyCode) {
					case 38: // up
					case 87: // w
						$$.global.controls.moveForward = false;
						break;
					case 37: // left
					case 65: // a
						$$.global.controls.moveLeft = false;
						break;
					case 40: // down
					case 83: // s
						$$.global.controls.moveBackward = false;
						break;
					case 39: // right
					case 68: // d
						$$.global.controls.moveRight = false;
						break;
				}
			}, false);
		}
		controls.prevTime = performance.now();
		controls.update = function() {
			if($$.global.controls.enabled) {
				$$.global.controls.time = performance.now();
				var delta = ($$.global.controls.time - $$.global.controls.prevTime) / 1000;
				$$.global.controls.velocity.x -= $$.global.controls.velocity.x * options.acceleration.x * delta;
				$$.global.controls.velocity.z -= $$.global.controls.velocity.z * options.acceleration.z * delta;
				$$.global.controls.velocity.y -= options.gravity * 100.0 * delta; // 100.0 = mass
				if($$.global.controls.moveForward) $$.global.controls.velocity.z -= options.speed.z * delta;
				if($$.global.controls.moveBackward) $$.global.controls.velocity.z += options.speed.z * delta;
				if($$.global.controls.moveLeft) $$.global.controls.velocity.x -= options.speed.x * delta;
				if($$.global.controls.moveRight) $$.global.controls.velocity.x += options.speed.x * delta;
				$$.global.controls.getObject().translateX($$.global.controls.velocity.x * delta);
				$$.global.controls.getObject().translateY($$.global.controls.velocity.y * delta);
				$$.global.controls.getObject().translateZ($$.global.controls.velocity.z * delta);
				if($$.global.controls.getObject().position.y < options.tall) {
					$$.global.controls.velocity.y = 0;
					$$.global.controls.getObject().position.y = options.tall;
					$$.global.controls.canJump = true;
				}
				$$.global.controls.prevTime = $$.global.controls.time;
			}
		};
		return controls;
	},
};
$$.Move = {
	Linear: function(obj, speedRate, targetPosition) {
		this.obj = obj;
		this.speedRate = speedRate;
		this.targetPosition = targetPosition;

		this.direction = {
			x: this.targetPosition.x - this.obj.position.x,
			y: this.targetPosition.y - this.obj.position.y,
			z: this.targetPosition.z - this.obj.position.z,
		};

		var uvec = $$.unitVector(this.direction);
		this.speed = {
			x: uvec.x * speedRate,
			y: uvec.y * speedRate,
			z: uvec.z * speedRate,
		};

		this.update = function() {
			var owner = arguments.callee.owner;
			owner.direction = {
				x: owner.targetPosition.x - owner.obj.position.x,
				y: owner.targetPosition.y - owner.obj.position.y,
				z: owner.targetPosition.z - owner.obj.position.z,
			};
			var dLen = vecLength(owner.direction);
			if(dLen < owner.speedRate) {
				owner.obj.position.x = owner.targetPosition.x;
				owner.obj.position.y = owner.targetPosition.y;
				owner.obj.position.z = owner.targetPosition.z;
				owner.destroy();
			} else {
				owner.obj.position.x += owner.speed.x;
				owner.obj.position.y += owner.speed.y;
				owner.obj.position.z += owner.speed.z;
			}
		};
		this.update.owner = this;
		this.destroy = function() {
			for(var i = 0; i < $$.actionInjections.length; i++) {

				if($$.actionInjections[i] == this.update) {
					$$.actionInjections.splice(i, 1);
					break;
				}
			}
		};
	},
	Surround: function(mother, child, speedRate, vVect) {
		this.angle = 0;
		this.speedRate = speedRate;
		this.mother = mother;
		this.child = child;
		this.vVect = vVect;
		this.radius = $$.vecLength({
			x: this.child.position.x - this.mother.position.x,
			y: this.child.position.y - this.mother.position.y,
			z: this.child.position.z - this.mother.position.z
		});
		this.update = function() {
			var childToMotherVec = {
				x: this.child.position.x - this.mother.position.x,
				y: this.child.position.y - this.mother.position.y,
				z: this.child.position.z - this.mother.position.z
			};
			var modVec1 = $$.vecLength(childToMotherVec);
			childToMotherVec.x = childToMotherVec.x * this.radius / modVec1;
			childToMotherVec.y = childToMotherVec.y * this.radius / modVec1;
			childToMotherVec.z = childToMotherVec.z * this.radius / modVec1;

			var speedVec = $$.crossMulti(childToMotherVec, vVect);
			var modSpeedVec = $$.vecLength(speedVec);
			speedVec.x = speedVec.x * speedRate / modSpeedVec;
			speedVec.y = speedVec.y * speedRate / modSpeedVec;
			speedVec.z = speedVec.z * speedRate / modSpeedVec;

			child.position.x += speedVec.x;
			child.position.y += speedVec.y;
			child.position.z += speedVec.z;

			var vec2 = {
				x: this.child.position.x - this.mother.position.x,
				y: this.child.position.y - this.mother.position.y,
				z: this.child.position.z - this.mother.position.z
			};

			var modVec2 = $$.vecLength(vec2);
			vec2.x = vec2.x * this.radius / modVec2;
			vec2.y = vec2.y * this.radius / modVec2;
			vec2.z = vec2.z * this.radius / modVec2;
			this.child.position.x = this.mother.position.x + vec2.x;
			this.child.position.y = this.mother.position.y + vec2.y;
			this.child.position.z = this.mother.position.z + vec2.z;
		};
		this.destroy = function() {
			for(var i = 0; i < $$.actionInjections.length; i++) {
				if($$.actionInjections[i] == this.update) {
					$$.actionInjections.splice(i, 1);
					break;
				}
			}
		};
	},
	RelateToCamera:function(obj,isFaceToCamera,world){
		if(!world){
			this.camera=$$.global.camera;
		}else{
			this.camera=world.camera;
		}
		this.obj=obj;
		this.isFaceToCamera=isFaceToCamera;
		this.absVec={
			x:obj.position.x-this.camera.position.x,
			y:obj.position.y-this.camera.position.y,
			z:obj.position.z-this.camera.position.z
		};
		console.log(this.absVec);
		this.update=function(){
			var owner=arguments.callee.owner;
			owner.obj.position.x=owner.camera.position.x+owner.absVec.x;
			owner.obj.position.y=owner.camera.position.y+owner.absVec.y;
			owner.obj.position.z=owner.camera.position.z+owner.absVec.z;
			if(isFaceToCamera){
				owner.obj.lookAt(owner.camera.position);
			}
		};
		this.update.owner=this;
		this.destroy = function() {
			for(var i = 0; i < $$.actionInjections.length; i++) {
				if($$.actionInjections[i] == this.update) {
					$$.actionInjections.splice(i, 1);
					break;
				}
			}
		};
	}
};

$$.crossMulti = function(vec1, vec2) {
	var res = {
		x: 0,
		y: 0,
		z: 0
	};
	res.x = vec1.y * vec2.z - vec2.y * vec1.z;
	res.y = vec1.z * vec2.x - vec2.z * vec1.x;
	res.z = vec1.x * vec2.y - vec2.x * vec1.y;
	return res;
};

$$.vecLength = function(vec) {
	return Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
};

$$.unitVector = function(vec) {
	var len = $$.vecLength(vec);
	vec.x /= len;
	vec.y /= len;
	vec.z /= len;
	return vec;
};
$$.Weather = {
	Snow: function(options, texture) {
		options = $$.extends({}, [{
			startSpeed: 2,
			endSpeed: 10,
			duration: 50,
			amount: 2000,
			startAmount: 500,
			fallSpeed: 2,
			scale: [10, 20],
			wind: {
				x: 0,
				y: 0,
				z: 0
			},
			area: {
				x: [-2000, 2000],
				y: [-2000, 2000],
				z: [-2000, 2000],
			},
			swing: {
				x: 2,
				y: 0,
				z: 2
			}
		}, options]);
		this.amount = options.amount;
		this.startAmount = options.startAmount;
		this.fallSpeed = options.fallSpeed;
		this.scale = options.scale;
		this.wind = options.wind;
		this.swing = options.swing;
		this.startSpeed = options.startSpeed;
		this.endSpeed = options.endSpeed;
		this.duration = options.duration;
		this.particles = [];
		this.material = new THREE.SpriteMaterial({
			map: texture,
			transparent:true,
			needsUpdate:false,
			color: 0xffffff
		});
		this.onStartEnd = function() {
			console.log("snow start end");
		};
		this.onEndEnd = function() {
			console.log("snow end end");
		};
		this.area = options.area;

		function randomRange(min, max) {
			return((Math.random() * (max - min)) + min);
		}

		function rndInt(n) {
			return Math.floor(Math.random() * n);
		}

		for(i = 0; i < this.startAmount; i++) {
			var particle = new THREE.Sprite(this.material);
			var randomScale = randomRange(this.scale[0], this.scale[1]);
			particle.position.x = randomRange(this.area.x[0], this.area.x[1]);
			particle.position.y = randomRange(this.area.y[0], this.area.y[1]);
			particle.position.z = randomRange(this.area.z[0], this.area.z[1]);
			particle.scale.x = particle.scale.y = particle.scale.z = randomScale;
			particle.v = new THREE.Vector3(0, this.wind.y - this.fallSpeed + randomRange(-this.swing.y, this.swing.y), 0);
			particle.v.z = (this.wind.z + randomRange(-this.swing.z, this.swing.z));
			particle.v.x = (this.wind.x + randomRange(-this.swing.x, this.swing.x));

			this.particles.push(particle);
			$$.global.scene.add(particle);
		}

		this.start = function() {
			var timer = new $$.Component.Timer({
				life: (this.amount - this.startAmount) / this.startSpeed * this.duration,
				duration: this.duration,
				onRepeat: function() {
					for(var i = 0; i < this.owner.startSpeed; i++) {
						if(this.owner.particles.length >= this.owner.amount) {
							break;
						}
						var particle = new THREE.Sprite(this.owner.material);
						var randomScale = randomRange(this.owner.scale[0], this.owner.scale[1]);
						particle.position.x = randomRange(this.owner.area.x[0], this.owner.area.x[1]);
						particle.position.y = this.owner.area.y[1];
						particle.position.z = randomRange(this.owner.area.z[0], this.owner.area.z[1]);
						particle.scale.x = particle.scale.y = particle.scale.z = randomScale;
						particle.v = new THREE.Vector3(0, this.owner.wind.y - this.owner.fallSpeed + randomRange(-this.owner.swing.y, this.owner.swing.y), 0);
						particle.v.z = (this.owner.wind.z + randomRange(-this.owner.swing.z, this.owner.swing.z));
						particle.v.x = (this.owner.wind.x + randomRange(-this.owner.swing.x, this.owner.swing.x));

						this.owner.particles.push(particle);
						$$.global.scene.add(particle);
					}
				},
				onEnd: this.onStartEnd
			});
			timer.owner = this;
			timer.start();
			$$.actionInjections.push(this.update);
		};

		this.end = function() {
			var timer = new $$.Component.Timer({
				life: (this.amount / this.endSpeed + 1) * this.duration,
				duration: this.duration,
				onRepeat: function() {
					for(var i = 0; i < this.owner.endSpeed; i++) {
						if(this.owner.particles.length > 0) {
							var id = rndInt(this.owner.particles.length);
							$$.global.scene.remove(this.owner.particles[id]);
							this.owner.particles.splice(id, 1);
						} else {
							break;
						}
					}
				},
				onEnd: function() {
					while(this.owner.particles.length) {
						var id = rndInt(this.owner.particles.length);
						$$.global.scene.remove(this.owner.particles[id]);
						this.owner.particles.splice(id, 1);
					}
					onEnd: this.owner.onEndEnd;
				}
			});
			timer.owner = this;
			timer.start();
			$$.actionInjections.push(this.update);
		};

		this.update = function() {
			var owner = arguments.callee.owner;
			for(var i = 0; i < owner.particles.length; i++) {
				var particle = owner.particles[i];
				var pp = particle.position;

				pp.add(particle.v);

				if(pp.y < owner.area.y[0]) pp.y = owner.area.y[1];
				if(pp.x > owner.area.x[1]) pp.x = owner.area.x[0];
				else if(pp.x < owner.area.x[0]) pp.x = owner.area.x[1];
				if(pp.z > owner.area.z[1]) pp.z = owner.area.z[0];
				else if(pp.z < owner.area.z[0]) pp.z = owner.area.z[1];
			}
		};
		this.update.owner = this;
	}
};
$$.Device = {
	getOSInfo: function() {
		var ua = navigator.userAgent,
			isWindowsPhone = /(?:Windows Phone)/.test(ua),
			isSymbian = /(?:SymbianOS)/.test(ua) || isWindowsPhone,
			isAndroid = /(?:Android)/.test(ua),
			isFireFox = /(?:Firefox)/.test(ua),
			isChrome = /(?:Chrome|CriOS)/.test(ua),
			isTablet = /(?:iPad|PlayBook)/.test(ua) || (isAndroid && !/(?:Mobile)/.test(ua)) || (isFireFox && /(?:Tablet)/.test(ua)),
			isPhone = /(?:iPhone)/.test(ua) && !isTablet,
			isPc = !isPhone && !isAndroid && !isSymbian && !isTablet;
		return {
			isTablet: isTablet,
			isIPhone: isPhone,
			isAndroid: isAndroid,
			isPc: isPc
		};
	},
	openWebcam: function(video) {
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
		window.URL = window.URL || window.webkitURL;
		if(navigator.getUserMedia) {
			navigator.getUserMedia({
				video: true
			}, gotStream, noStream);
		}
		var stream;
		function gotStream(s) {
			$$.global.webCamSteam=s;
			stream = s;
			if(window.URL) {
				video.src = window.URL.createObjectURL(stream);
			} else {
				video.src = stream;
			}
			camvideo.onerror = function(e) {
				stream.stop();
			};
			stream.onended = noStream;
		}

		function noStream(e) {
			var msg = 'No camera available.';
			if(e.code == 1) {
				msg = 'User denied access to use camera.';
			}
			console.log(msg)
		}
	},
	closeWebcam:function(){
		if($$.global.webCamSteam){
			var tracks=$$.global.webCamSteam.getVideoTracks();
			for(var i =0;i<tracks.length;i++){
				tracks[i].stop();
			}
			tracks=$$.global.webCamSteam.getAudioTracks();
			for(var i =0;i<tracks.length;i++){
				tracks[i].stop();
			}
			$$.global.webCamSteam=null;
		}
	},
	toggleWebCam:function(video){
		if($$.global.webCamSteam){
			$$.Device.closeWebcam();
		}else{
			$$.Device.openWebcam(video);
		}
	}
};
$$.sound={
	
}
