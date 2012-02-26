module('lively.morphic.video.Video').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.WidgetsTraits', 'lively.morphic.Styles').toRun(function() {

var res = [
		          "lib/jquery.min.js", 
		          "lib/jquery-ui/jquery-ui.min.js",
		          "lib/jme/utils/a11y-slider.ext.js",
		          "lib/jme/packages/mm.full.min.js",
		          "lib/jme/plugins/fullwindow.js",
		          "lib/jme/plugins/timerange.js",
		          "lib/jme/plugins/track.js",
		          "lib/mustache.js",
//		          ]
//var css = [
          "lib/jquery-ui/themes/redmond/jquery-ui.css",
          "lib/jme/css/styles.css",
          "lib/jme/css/player-controls.css",
          "lib/jme/css/custom.css"
          ]

JSLoader.resolveAndLoadAll(LivelyLoader.codeBase, res) //shall insert all css and js to the head, albeit asynchronously
	
lively.morphic.Morph.subclass('lively.morphic.Video',
'settings', {
		style: {
			enableGrabbing: false,
			enableDropping: false 
		},

		template: undefined
},
'initializing', {
	
	initialize: function($super, json, bounds) {
		
		$super();
		
//		this.loadResources(this.css)
//		this.loadResources(this.scriptS)
		
		var mainDiv = XHTMLNS.create('div');

		mainDiv.id =  "lively-morphic-Video-internal-" + this.id
		json.id = mainDiv.id
		
		template = this.getTemplate()

		mainDiv.innerHTML = Mustache.to_html(template, json).replace(/^\s*/mg, '');
		
		this.setShape(new lively.morphic.Shapes.External(mainDiv));
		if (bounds) this.setBounds(bounds);
		
		//this.setExtent(pt(mainDiv.offsetWidth, mainDiv.offsetHeight))
		this.setExtent(pt(432.0,277.0))// taken from player-controls.css

		
	}
},
'util',{
	
	getTemplate: function(){
		
		if(this.template){
			return this.template;
		}
		
		req = new WebResource(LivelyLoader.codeBase + 'lively/morphic/video/video.xhtml.mustache')
		this.template = req.get().content
		return this.template
	},
	
//	loadResources: function (res){
//			
//		for ( var i=0, len=res.length; i<len; ++i ){
//			this.loadResource(LivelyLoader.codeBase + res[i])
//		}		
//	},
//	loadResource: function(res){
//		if(JSLoader.scriptInDOM(res)){
//			return
//		}
//		
//		if(res.match(/\.js$/)){
//			
//			var el=document.createElement('script')
//			el.setAttribute("type","text/ecmascript")
//			el.setAttribute("src", res)
//		} else if(res.match(/\.css$/)){
//			 var el=document.createElement("link")
//			  el.setAttribute("rel", "stylesheet")
//			  el.setAttribute("type", "text/css")
//			  el.setAttribute("href",res)
//		}
//		if (typeof el!="undefined") {
//			el.setAttribute("id", res)
//			document.getElementsByTagName("head")[0].appendChild(el)
//		}
			
//	}
})

}) // end of module