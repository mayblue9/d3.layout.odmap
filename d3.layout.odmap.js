/*global nmap,d3,nmap_extend,nmap_squared,console,nmap_element */
/*jshint unused:false*/

/**
* d3 layout helper for origin-destination visualizations
* @constructor
* @param {object} args
* @param {object} args.s - data selectors
* @param {string} args.s.x="x" - x position of item
* @param {string} args.s.y="y" - y position of item
* @param {string} args.s.id="id" - id of item (required)
* @param {string} args.s.title="id" - title of item
* @param {string} args.s.hx="hx" - alternative x position of item
* @param {string} args.s.hy="hy" - alternative y position of item
* @param {string} args.s.hwidth="hwidth" - alternative width of item
* @param {string} args.s.hheight="hheight" - alternative height of item
* @param {integer|float} args.height=300 - height of the available space
* @param {integer|float} args.width=300 - width of the available space
* @param {boolean} args.hand=false - If the dataset contains alternative coordinates (hx,hy,hwidth,hheight)
* @param {object} args.nmap - Settings for the nmap algorithm
* @param {string} args.cut="alternate" - nmap method
* @param {string} args.method="border" - nmap_squared method
* @param {boolean} args.square=true - nmap_squared option
* @param {float|integer} args.border_adv=1.9 - nmap_squared option
* @return {object} odmap helper
*/
d3.layout.odmap = function(args){
	if(typeof(nmap) !== typeof(Function)){ throw "ERROR: You need to include the nmap.js library."; }	

	//data
	var data = [];

	var defaults = {
		s:{
			//Geographic x/y coordinates
			x : "x",
			y : "y",
			//id/title attribute
			id : "id",
			title : "id",
			//handwritten grid
			hx : "hx",
			hy : "hy",
			hwidth : "hwidth",
			hheight : "hheight"
		},
		nmap:{
			cut:"alternate",
			method:"border",
			square:true,
			border_adv:1.0
		},
		hand:false,
		width:300,
		height:300
	};

	//given arguments and defaults
	var attr = nmap_extend(defaults, args);

	/**
	* Create squared
	* @constructor
	*/
	function od(){
	}

	od();

	var swidth, 
		sheight, 
		fwidth,
		fheight,
		sx, 
		sy, 
		i, ii, iii,
		data_switch = "", 
		mm={
			min : Number.MAX_VALUE,
			max : -Number.MAX_VALUE,
			imin : Number.MAX_VALUE,
			imax : -Number.MAX_VALUE,
			//Max/Min without transfers where (o == d)
			smin : Number.MAX_VALUE,
			smax : -Number.MAX_VALUE,
			ismin : Number.MAX_VALUE,
			ismax : -Number.MAX_VALUE
		},
		grid_width, 
		grid_height,
		row_count,
		col_count;

	/**
	* setup the data
	* @param {array} d - The array contains a list of points
	* @param {object} d[] - The structure of the objects depends on the selectors set in the initial arguments
	*/
	od.data = function(d){
		/*--- Calculate the extend of the data and normalize it ---*/
		var maxX = -Number.MAX_VALUE,
			minX = Number.MAX_VALUE,
			maxY = -Number.MAX_VALUE,
			minY = Number.MAX_VALUE,
			hmaxX = -Number.MAX_VALUE,
			hminX = Number.MAX_VALUE,
			hmaxY = -Number.MAX_VALUE,
			hminY = Number.MAX_VALUE;

		var x,y,hx,hy,hwidth,hheight,shx,shy;

		for(i = 0; i<d.length; i++){
			x = parseFloat(d[i].x);
			y = parseFloat(d[i].y);

			if(x > maxX){maxX = x;}
			if(x < minX){minX = x;}

			if(y > maxY){maxY = y;}
			if(y < minY){minY = y;}

			if(attr.hand){
				hx = parseFloat(d[i][attr.s.hx]);
				hy = parseFloat(d[i][attr.s.hy]);

				hwidth = parseFloat(d[i][attr.s.hwidth]);
				hheight = parseFloat(d[i][attr.s.hheight]);

				if((hx+hwidth) > hmaxX){hmaxX = hx;}
				if(hx < hminX){hminX = hx;}

				if((hy+hheight) > hmaxY){hmaxY = hy;}
				if(hy < hminY){hminY = hy;}
			}

		}

		swidth = maxX - minX;
		sheight = maxY - minY;
		sx = attr.width/swidth;
		sy = attr.height/sheight;

		if(sx<sy){
			sy = sx;
		}else{
			sx = sy;
		}

		fwidth = swidth*sx;
		fheight = sheight*sy;

		if(attr.hand){
			hwidth = hmaxX;
			hheight = hmaxY;
			shx = fwidth/hwidth;
			shy = fheight/hheight;
		}

		row_count = col_count = Math.ceil(Math.sqrt(d.length));
		grid_width = fwidth / col_count;
		grid_height = fheight / row_count;

		for(i = 0; i<d.length; i++){
			var item = {
				id:d[i][attr.s.id],
				title:d[i][attr.s.title],
				x:(parseFloat(d[i][attr.s.x])-minX)*sx,
				y:(parseFloat(d[i][attr.s.y])-minY)*sy,
				ox:d[i][attr.s.x],
				oy:d[i][attr.s.y],
				h:{
					x:0,
					y:0,
					width:0,
					height:0
				},
				g:{
					x:(i-Math.floor(i/col_count)*col_count)*grid_width,
					y:Math.floor(i/row_count)*grid_height,
					width:grid_width,
					height:grid_height
				},
				data:{
					min:Number.MAX_VALUE,
					max:-Number.MAX_VALUE,
					data:[]
				},
				idata:{
					min:Number.MAX_VALUE,
					max:-Number.MAX_VALUE,
					data:[]
				},
				n:{
					x:0,
					y:0,
					width:0,
					height:0
				}
			};

			//If available get the handwritten grid
			if(attr.hand){
				item.h.x = (parseFloat(d[i][attr.s.hx])-hminX)*shx;
				item.h.y = (parseFloat(d[i][attr.s.hy])-hminY)*shy;
				item.h.width = parseFloat(d[i][attr.s.hwidth])*shx;
				item.h.height = parseFloat(d[i][attr.s.hheight])*shy;
			}

			//Sorting the data for o/d and d/o
			var n,dd;
			for(ii = 0; ii<d.length; ii++){
				n = parseFloat(d[ii][item.id]);
				dd = {
					amount:n,
					x:0,
					y:0,
					width:0,
					height:0,
					id:d[ii][attr.s.id]
				};
				item.data.data.push(dd);

				if(n > item.data.max){
					item.data.max = n;
				}
				if(n < item.data.min){
					item.data.min = n;
				}
				if(n > mm.max){
					mm.max = d[ii][item.id];
				}
				if(n < mm.min){
					mm.min = d[ii][item.id];
				}
				if(i!==ii){
					if(n > mm.smax){
						mm.smax = d[ii][item.id];
					}
					if(n < mm.smin){
						mm.smin = d[ii][item.id];
					}	
				}
			}

			for(ii = 0; ii<d.length; ii++){
				n = parseFloat(d[i][d[ii][attr.s.id]]);
				dd = {
					amount:n,
					x:0,
					y:0,
					width:0,
					height:0,
					id:d[ii][attr.s.id]
				};
				item.idata.data.push(dd);

				if(n > item.idata.max){
					item.idata.max = n;
				}
				if(n < item.idata.min){
					item.idata.min = n;
				}
				if(n > mm.imax){
					mm.imax = d[ii][item.id];
				}
				if(n < mm.imin){
					mm.imin = d[ii][item.id];
				}
				if(i!==ii){
					if(n > mm.ismax){
						mm.ismax = d[ii][item.id];
					}
					if(n < mm.ismin){
						mm.ismin = d[ii][item.id];
					}	
				}
			}

			data.push(item);
		}

		/*--- NMAP MAPPING ---*/

		var nmap_data = nmap_squared({
			width:attr.width,
			height:attr.height,
			data:data,
			method:attr.nmap.method,
			square:attr.nmap.square,
			border_adv:attr.nmap.border_adv
		});

		var nmap_elements = [];
		for(i = 0; i<nmap_data.data.length; i++){
			nmap_elements.push(new nmap_element({
				id:nmap_data.data[i].id,
				x:nmap_data.data[i].x,
				y:nmap_data.data[i].y,
				weight:10000+Math.random(),
				klass:nmap_data.data[i].class
			}));
		}

		var odNmap = new nmap({
			x:0,
			y:0,
			width:nmap_data.width, 
			height:nmap_data.height
		});

		var nmap_cut;
		if(attr.nmap.cut==="alternate"){
			nmap_cut = odNmap.alternateCut({
				elements:nmap_elements
			});
		}else{
			nmap_cut = odNmap.equalWeight({
				elements:nmap_elements
			});
		}

		for(ii = 0; ii<data.length; ii++){
			for(i = 0; i<nmap_cut.length; i++){
				if(nmap_cut[i].attr().element.attr().id === data[ii].id){
					data[ii].n.x = nmap_cut[i].attr().x;
					data[ii].n.y = nmap_cut[i].attr().y;
					data[ii].n.width = nmap_cut[i].attr().width;
					data[ii].n.height = nmap_cut[i].attr().height;
				}
			}
		}


	};

	/**
	* Helper functions for switching between o/d and d/o
	*/
	od.toggle = function(){
		if(data_switch === ""){
			data_switch = "i";
		}else{
			data_switch = "";
		}
	};

	/**
	* Helper function for switching to either o/d and d/o
	* @param {string} to - either "i" -> inverse or "" -> normal
	*/
	od.switchTo = function(to){
		data_switch = to;
	};

	/**
	* Original position normalized to given space
	* @param {function} inner - d3.layout.odmap function for the inner representation of the data
	* @return {object} r - result array
	* @return {float|integer} r.min - minimum for od-values
	* @return {float|integer} r.max - minimum for od-values
	* @return {float|integer} r.smin - minimum for od-values without data where (o == d)
	* @return {float|integer} r.smax - minimum for od-values without data where (o == d)
	* @return {float|integer} r.width - width
	* @return {float|integer} r.height - width
	* @return {array} r.data - the origin data
	* @return {float|integer} r.data[].x - x position of origin data
	* @return {float|integer} r.data[].y - y position of origin data
	* @return {float|integer} r.data[].width - width position of origin data
	* @return {float|integer} r.data[].height - height position of origin data
	* @return {string} r.data[].id - id of origin data
	* @return {object} r.data[].data - destination data for this origin
	* @return {float|integer} r.data[].data.max - max for this group of ods
	* @return {float|integer} r.data[].data.min - min for this group of ods
	* @return {array} r.data[].data.data - destination data for this origin
	* @return {float|integer} r.data[].data.data[].x - x position of destination data
	* @return {float|integer} r.data[].data.data[].y - y position of destination data
	* @return {float|integer} r.data[].data.data[].width - width position of destination data
	* @return {float|integer} r.data[].data.data[].height - height position of destination data
	* @return {string} r.data[].data.data[].id - id of destination data
	*/
	od.geo = function(inner){
		var r = {
			min:mm[data_switch+"min"],
			max:mm[data_switch+"max"],
			smin:mm[data_switch+"smin"],
			smax:mm[data_switch+"smax"],
			width:fwidth,
			height:fheight,
			data:[]
		};

		for(i = 0; i<data.length; i++){
			r.data.push({
				x:data[i].x,
				y:data[i].y,
				width:data[i].g.width,
				height:data[i].g.height,
				id:data[i].id,
				data:data[i][data_switch+"data"]
			});
		}

		if(typeof inner === 'undefined'){
			return r;
		}else{
			return od.setData(r, inner);
		}
	};

	/**
	* Nmap position generated through nmap_squared > nmap 
	* @param {function} inner - d3.layout.odmap function for the inner representation of the data
	* @return {object} r - result array
	* @return {float|integer} r.min - minimum for od-values
	* @return {float|integer} r.max - minimum for od-values
	* @return {float|integer} r.smin - minimum for od-values without data where (o == d)
	* @return {float|integer} r.smax - minimum for od-values without data where (o == d)
	* @return {float|integer} r.width - width
	* @return {float|integer} r.height - width
	* @return {array} r.data - the origin data
	* @return {float|integer} r.data[].x - x position of origin data
	* @return {float|integer} r.data[].y - y position of origin data
	* @return {float|integer} r.data[].width - width position of origin data
	* @return {float|integer} r.data[].height - height position of origin data
	* @return {string} r.data[].id - id of origin data
	* @return {object} r.data[].data - destination data for this origin
	* @return {float|integer} r.data[].data.max - max for this group of ods
	* @return {float|integer} r.data[].data.min - min for this group of ods
	* @return {array} r.data[].data.data - destination data for this origin
	* @return {float|integer} r.data[].data.data[].x - x position of destination data
	* @return {float|integer} r.data[].data.data[].y - y position of destination data
	* @return {float|integer} r.data[].data.data[].width - width position of destination data
	* @return {float|integer} r.data[].data.data[].height - height position of destination data
	* @return {string} r.data[].data.data[].id - id of destination data
	*/
	od.nmap = function(inner){
		var r = {
			min:mm[data_switch+"min"],
			max:mm[data_switch+"max"],
			smin:mm[data_switch+"smin"],
			smax:mm[data_switch+"smax"],
			width:fwidth,
			height:fheight,
			data:[]
		};
		for(i = 0; i<data.length; i++){
			r.data.push({
				x:data[i].n.x,
				y:data[i].n.y,
				width:data[i].n.width,
				height:data[i].n.height,
				id:data[i].id,
				data:data[i][data_switch+"data"]
			});
		}
		
		if(typeof inner === 'undefined'){
			return r;
		}else{
			return od.setData(r, inner);
		}
	};

	/**
	* Alternative positions from the original dataset via attr.s.hx/attr.s.hy and attr.s.hwidth/attr.s.hheight
	* @param {function} inner - d3.layout.odmap function for the inner representation of the data
	* @return {object} r - result array
	* @return {float|integer} r.min - minimum for od-values
	* @return {float|integer} r.max - minimum for od-values
	* @return {float|integer} r.smin - minimum for od-values without data where (o == d)
	* @return {float|integer} r.smax - minimum for od-values without data where (o == d)
	* @return {float|integer} r.width - width
	* @return {float|integer} r.height - width
	* @return {array} r.data - the origin data
	* @return {float|integer} r.data[].x - x position of origin data
	* @return {float|integer} r.data[].y - y position of origin data
	* @return {float|integer} r.data[].width - width position of origin data
	* @return {float|integer} r.data[].height - height position of origin data
	* @return {string} r.data[].id - id of origin data
	* @return {object} r.data[].data - destination data for this origin
	* @return {float|integer} r.data[].data.max - max for this group of ods
	* @return {float|integer} r.data[].data.min - min for this group of ods
	* @return {array} r.data[].data.data - destination data for this origin
	* @return {float|integer} r.data[].data.data[].x - x position of destination data
	* @return {float|integer} r.data[].data.data[].y - y position of destination data
	* @return {float|integer} r.data[].data.data[].width - width position of destination data
	* @return {float|integer} r.data[].data.data[].height - height position of destination data
	* @return {string} r.data[].data.data[].id - id of destination data
	*/
	od.hand = function(inner){
		var r = {
			min:mm[data_switch+"min"],
			max:mm[data_switch+"max"],
			smin:mm[data_switch+"smin"],
			smax:mm[data_switch+"smax"],
			width:fwidth,
			height:fheight,
			data:[]
		};

		for(i = 0; i<data.length; i++){
			r.data.push({
				x:data[i].h.x,
				y:data[i].h.y,
				width:data[i].h.width,
				height:data[i].h.height,
				id:data[i].id,
				data:data[i][data_switch+"data"]
			});
		}

		if(typeof inner === 'undefined'){
			return r;
		}else{
			return od.setData(r, inner);
		}
	};

	/**
	* An origin destination matrix with rows and cols
	* @param {function} inner - d3.layout.odmap function for the inner representation of the data
	* @return {object} r - result array
	* @return {float|integer} r.min - minimum for od-values
	* @return {float|integer} r.max - minimum for od-values
	* @return {float|integer} r.smin - minimum for od-values without data where (o == d)
	* @return {float|integer} r.smax - minimum for od-values without data where (o == d)
	* @return {float|integer} r.width - width
	* @return {float|integer} r.height - width
	* @return {array} r.data - the origin data
	* @return {float|integer} r.data[].x - x position of origin data
	* @return {float|integer} r.data[].y - y position of origin data
	* @return {float|integer} r.data[].width - width position of origin data
	* @return {float|integer} r.data[].height - height position of origin data
	* @return {string} r.data[].id - id of origin data
	* @return {object} r.data[].data - destination data for this origin
	* @return {float|integer} r.data[].data.max - max for this group of ods
	* @return {float|integer} r.data[].data.min - min for this group of ods
	* @return {array} r.data[].data.data - destination data for this origin
	* @return {float|integer} r.data[].data.data[].x - x position of destination data
	* @return {float|integer} r.data[].data.data[].y - y position of destination data
	* @return {float|integer} r.data[].data.data[].width - width position of destination data
	* @return {float|integer} r.data[].data.data[].height - height position of destination data
	* @return {string} r.data[].data.data[].id - id of destination data
	*/
	od.matrix = function(inner){
		var r = {
			min:mm[data_switch+"min"],
			max:mm[data_switch+"max"],
			smin:mm[data_switch+"smin"],
			smax:mm[data_switch+"smax"],
			width:attr.width,
			height:attr.height,
			data:[]
		};

		if(typeof inner === 'undefined'){
			for(i = 0; i<data.length; i++){
				r.data.push({
					x:i*attr.width/data.length,
					y:0,
					width:attr.width/data.length,
					height:attr.height,
					id:data[i].id,
					data:data[i][data_switch+"data"]
				});
			}
		}else{
			for(i = 0; i<data.length; i++){
			r.data.push({
				x:0,
				y:i*attr.height/data.length,
				width:attr.width,
				height:attr.height/data.length,
				id:data[i].id,
				data:data[i][data_switch+"data"]
			});
		}
		}

		if(typeof inner === 'undefined'){
			return r;
		}else{
			return od.setData(r, inner);
		}
	};

	/**
	* output optimized for d3 sankey plugin
	* @return {array} r - result array
	* @return {array} r[].nodes - nodes (origins and destinations) The first half of the array contains the origins and the second half the destinations
	* @return {object} r[].nodes[] - origin/destination object
	* @return {string} r[].nodes[].name - id of origin/destination
	* @return {object} r[].links[] - connection object
	* @return {integer} r[].links[].source - id of object in nodes array
	* @return {integer} r[].links[].target - id of object in nodes array
	* @return {integer|float} r[].links[].value - od value
	*/
	od.sankey = function(){
		var r = {
			nodes:[],
			links:[]
		};

		//add origins
		for(i = 0; i<data.length; i++){
			r.nodes.push({name:data[i].id});
		}

		//add destinations
		for(i = 0; i<data[0][data_switch+"data"].data.length; i++){
			r.nodes.push({name:data[i].id});
		}

		//add links
		for(i = 0; i<data.length; i++){
			for(ii = 0; ii<data[i][data_switch+"data"].data.length; ii++){
				r.links.push({
					source:i,
					target:ii+data.length,
					value:data[i][data_switch+"data"].data[ii].amount
				});
			}
		}

		return r;
	};

	/**
	* output an array optimized for the d3 biPartite visualization
	* @return {array} r - result array
	* @return {string} r[][0] - id of origin
	* @return {string} r[][1] - id of destination
	* @return {integer|float} r[][2] - id of value of od
	*/
	od.bipartite = function(){
		var r = [];
		for(i = 0; i<data.length; i++){
			for(ii = 0; ii<data[i][data_switch+"data"].data.length; ii++){
				r.push([
					data[i].id,
					data[i][data_switch+"data"].data[ii].id,
					data[i][data_switch+"data"].data[ii].amount
				]);
			}
		}

		return r;
	};

	/**
	* A simple list, ordered by the given order from the original data set
	* @param {function} inner - d3.layout.odmap function for the inner representation of the data
	* @return {object} r - result array
	* @return {float|integer} r.min - minimum for od-values
	* @return {float|integer} r.max - minimum for od-values
	* @return {float|integer} r.smin - minimum for od-values without data where (o == d)
	* @return {float|integer} r.smax - minimum for od-values without data where (o == d)
	* @return {float|integer} r.width - width
	* @return {float|integer} r.height - width
	* @return {array} r.data - the origin data
	* @return {float|integer} r.data[].x - x position of origin data
	* @return {float|integer} r.data[].y - y position of origin data
	* @return {float|integer} r.data[].width - width position of origin data
	* @return {float|integer} r.data[].height - height position of origin data
	* @return {string} r.data[].id - id of origin data
	* @return {object} r.data[].data - destination data for this origin
	* @return {float|integer} r.data[].data.max - max for this group of ods
	* @return {float|integer} r.data[].data.min - min for this group of ods
	* @return {array} r.data[].data.data - destination data for this origin
	* @return {float|integer} r.data[].data.data[].x - x position of destination data
	* @return {float|integer} r.data[].data.data[].y - y position of destination data
	* @return {float|integer} r.data[].data.data[].width - width position of destination data
	* @return {float|integer} r.data[].data.data[].height - height position of destination data
	* @return {string} r.data[].data.data[].id - id of destination data
	*/
	od.list = function(inner){
		var r = {
			min:mm[data_switch+"min"],
			max:mm[data_switch+"max"],
			smin:mm[data_switch+"smin"],
			smax:mm[data_switch+"smax"],
			width:fwidth,
			height:fheight,
			data:[]
		};

		for(i = 0; i<data.length; i++){
			r.data.push({
				x:0,
				y:(attr.height/data.length)*i,
				width:attr.width,
				height:attr.height/data.length,
				id:data[i].id,
				data:data[i][data_switch+"data"]
			});
		}

		if(typeof inner === 'undefined'){
			return r;
		}else{
			return od.setData(r, inner);
		}
	};

	/**
	* A simple grid, order given from the original dataset
	* @param {function} inner - d3.layout.odmap function for the inner representation of the data
	* @return {object} r - result array
	* @return {float|integer} r.min - minimum for od-values
	* @return {float|integer} r.max - minimum for od-values
	* @return {float|integer} r.smin - minimum for od-values without data where (o == d)
	* @return {float|integer} r.smax - minimum for od-values without data where (o == d)
	* @return {float|integer} r.width - width
	* @return {float|integer} r.height - width
	* @return {array} r.data - the origin data
	* @return {float|integer} r.data[].x - x position of origin data
	* @return {float|integer} r.data[].y - y position of origin data
	* @return {float|integer} r.data[].width - width position of origin data
	* @return {float|integer} r.data[].height - height position of origin data
	* @return {string} r.data[].id - id of origin data
	* @return {object} r.data[].data - destination data for this origin
	* @return {float|integer} r.data[].data.max - max for this group of ods
	* @return {float|integer} r.data[].data.min - min for this group of ods
	* @return {array} r.data[].data.data - destination data for this origin
	* @return {float|integer} r.data[].data.data[].x - x position of destination data
	* @return {float|integer} r.data[].data.data[].y - y position of destination data
	* @return {float|integer} r.data[].data.data[].width - width position of destination data
	* @return {float|integer} r.data[].data.data[].height - height position of destination data
	* @return {string} r.data[].data.data[].id - id of destination data
	*/
	od.grid = function(inner){
		var r = {
			min:mm[data_switch+"min"],
			max:mm[data_switch+"max"],
			smin:mm[data_switch+"smin"],
			smax:mm[data_switch+"smax"],
			width:fwidth,
			height:fheight,
			data:[]
		};

		for(i = 0; i<data.length; i++){
			r.data.push({
				x:data[i].g.x,
				y:data[i].g.y,
				width:data[i].g.width,
				height:data[i].g.height,
				id:data[i].id,
				data:data[i][data_switch+"data"]
			});
		}

		if(typeof inner === 'undefined'){
			return r;
		}else{
			return od.setData(r, inner);
		}
	};

	/**
	* This function receives two dataset one for the outer positioning and one for the inner and combines them and returns a unified result object
	* @param {object} r - result object (see below)
	* @param {object} inner - result object (see below)
	* @return {object} r - result array
	* @return {float|integer} r.min - minimum for od-values
	* @return {float|integer} r.max - minimum for od-values
	* @return {float|integer} r.smin - minimum for od-values without data where (o == d)
	* @return {float|integer} r.smax - minimum for od-values without data where (o == d)
	* @return {float|integer} r.width - width
	* @return {float|integer} r.height - width
	* @return {array} r.data - the origin data
	* @return {float|integer} r.data[].x - x position of origin data
	* @return {float|integer} r.data[].y - y position of origin data
	* @return {float|integer} r.data[].width - width position of origin data
	* @return {float|integer} r.data[].height - height position of origin data
	* @return {string} r.data[].id - id of origin data
	* @return {object} r.data[].data - destination data for this origin
	* @return {float|integer} r.data[].data.max - max for this group of ods
	* @return {float|integer} r.data[].data.min - min for this group of ods
	* @return {array} r.data[].data.data - destination data for this origin
	* @return {float|integer} r.data[].data.data[].x - x position of destination data
	* @return {float|integer} r.data[].data.data[].y - y position of destination data
	* @return {float|integer} r.data[].data.data[].width - width position of destination data
	* @return {float|integer} r.data[].data.data[].height - height position of destination data
	* @return {string} r.data[].data.data[].id - id of destination data
	*/
	od.setData = function(r, inner){
		var inner_key = [];
		for(iii = 0; iii<inner.data.length; iii++){
			inner_key[inner.data[iii].id] = iii;
		}

		for(i = 0; i<r.data.length; i++){
			for(ii = 0; ii<r.data[i].data.data.length; ii++){
				for(iii = 0; iii<inner.data.length; iii++){
					r.data[i].data.data[ii].x = inner.data[inner_key[r.data[i].data.data[ii].id]].x;
					r.data[i].data.data[ii].y = inner.data[inner_key[r.data[i].data.data[ii].id]].y;
					r.data[i].data.data[ii].width = inner.data[inner_key[r.data[i].data.data[ii].id]].width;
					r.data[i].data.data[ii].height = inner.data[inner_key[r.data[i].data.data[ii].id]].height;
				}
			}
		}

		return r;
	};

	return od;
};