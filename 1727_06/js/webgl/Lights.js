function Light(pos){
	this.position = pos;
	this.ambient = [0.0,0.0,0.0,0.0];
	this.diffuse = [0.0,0.0,0.0,0.0];
	this.specular = [0.0,0.0,0.0,0.0];
}

Light.prototype.addDiffuse = function (d){
	this.diffuse = d.slice(0);
}

Light.prototype.addAmbient = function(a){
	this.ambient = a.slice(0);
}

Light.prototype.addSpecular = function(s){
	this.specular = s.slice(0);
}

var Lights = {
	list : [],
	add : function(light){
		if (!(light instanceof Light)){
			alert('the parameter is not a light');
			return;
		}
		this.list.push(light);
	},
	
	getArray: function(type){
		var a = [];
		for(var i = 0, max = this.list.length; i < max; i+=1){
			a = a.concat(this.list[i][type]);
		}
		console.info(type+':'+a+'');
		return a;
	},

	get: function(idx){
		if (idx >= 0 && idx < this.list.length){
			return this.list[idx];
		}
	}
}