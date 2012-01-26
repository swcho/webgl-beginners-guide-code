function Picker(canvas){
    this.plist = [];
	this.canvas = canvas;
	this.texture = null;
	this.framebuffer = null;
	this.renderbuffer = null;
	this.configure();
};

Picker.prototype.configure = function(){

	//1. Init Frame Buffer
	this.framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
	this.framebuffer.width = 512*4;
	this.framebuffer.height = 512*2;
	
	//2. Init Picking Texture
	this.texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.framebuffer.width, this.framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	
	//3. Init Render Buffer
	this.renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.framebuffer.width, this.framebuffer.height);
	
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);
	

	//4. Clean up
	gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

Picker.prototype._compare = function(readout, object){
    var color = object.diffuse;
    return (Math.floor(color[0]*255) == readout[0] &&
			Math.floor(color[1]*255) == readout[1] && 
			Math.floor(color[2]*255) == readout[2]);
}

Picker.prototype.find = function(coords){
	
	//read one pixel
	var readout = new Uint8Array(1 * 1 * 4);
		
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
	gl.readPixels(coords.x,coords.y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,readout);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    var found = false;
    
	for(var i = 0, max = Scene.objects.length; i < max; i+=1){
		var ob = Scene.objects[i];
        if (ob.alias == 'floor') continue;
		if (this._compare(readout, ob)){
				ob.diffuse[3] = 0.7;
                this.plist.push(ob);
                found = true;
                break;
		}
	}
    return found;
};

Picker.prototype.clear = function(){
    for(var i = 0, max = this.plist.length; i < max; i+=1){
        var ob = this.plist[i];
        ob.diffuse[3] = 1.0;
    }
    this.plist = [];
}

Picker.prototype.getHits = function(){
    return this.plist;
}

Picker.prototype.move = function(dx,dy,camera,depth){
    
    if (this.plist.length == 0) return;
    
    for (var i = 0, max = this.plist.length; i < max; i+=1){
        var ob = this.plist[i];
        var pos = vec3.create([ob.position[0], ob.position[1], ob.position[2]]);
        
        var scaleY = vec3.create();
        var scaleX = vec3.create();
       
        if (!depth){
            vec3.scale(camera.up,   -dy * 0.05, scaleY);
            vec3.scale(camera.right, dx * 0.05, scaleX);
        }
        else{
            vec3.scale(camera.normal, dy * 0.05, scaleY);
        }
        
        
        
        vec3.add(pos, scaleY);
        vec3.add(pos, scaleX);
        
        ob.position[0] = pos[0];
        ob.position[1] = pos[1];
        ob.position[2] = pos[2];
    }
    draw();
}
