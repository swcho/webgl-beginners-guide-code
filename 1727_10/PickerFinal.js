function Picker(canvas){
    this.plist = [];
	this.canvas = canvas;
	this.texture = null;
	this.framebuffer = null;
	this.renderbuffer = null;
	this.configure();
};

Picker.prototype.configure = function(){

	var width = 512*4;
	var height = 512*2;
	
	//1. Init Picking Texture
	this.texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	
	//2. Init Render Buffer
	this.renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
	
    
    //3. Init Frame Buffer
    this.framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);
	

	//4. Clean up
	gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

Picker.prototype._compare = function(readout, color){
    //console.info('comparing object '+object.alias+' diffuse ('+Math.round(color[0]*255)+','+Math.round(color[1]*255)+','+Math.round(color[2]*255)+') == readout ('+ readout[0]+','+ readout[1]+','+ readout[2]+')');
    return (Math.abs(Math.round(color[0]*255)-readout[0]) <= 1 &&
			Math.abs(Math.round(color[1]*255)- readout[1]) <= 1 && 
			Math.abs(Math.round(color[2]*255)-readout[2]) <= 1);
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
        
        var color = ob.diffuse;
        if (ob.pcolor) {color = ob.pcolor;}
    
        if (this._compare(readout, color)){
            if (ob.picked){
                //deselect
                ob.picked = false;
                ob.diffuse = ob.previous.slice(0);
                this.plist.splice(this.plist.indexOf(ob),1);
            }
            else {
                ob.picked = true;
                ob.previous = ob.diffuse.slice(0);
                if (ob.pcolor){
                    ob.diffuse = ob.pcolor.slice(0);
                }
                else {
                    ob.diffuse[3] = 0.5;
                }
                this.plist.push(ob);
            }
            found = true;
            break;
        }
        
    }
    draw();
    return found;
};

var notifica_balls = false;
Picker.prototype.stop = function(){
    for(var i = 0, max = this.plist.length; i < max; i+=1){
        var ob = this.plist[i];
        ob.diffuse = ob.previous;
        Scene.removeObject(ob.alias);
        
        ob.picked = false;
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
        
        var factor = Math.max(Math.max(camera.position[0], camera.position[1]), camera.position[2])/1000;
       
        if (!depth){
            vec3.scale(camera.up,   -dy * factor, scaleY);
            vec3.scale(camera.right, dx * factor, scaleX);
        }
        else{
            vec3.scale(camera.normal, dy * factor, scaleY);
        }

        vec3.add(pos, scaleY);
        vec3.add(pos, scaleX);
        
        ob.position[0] = pos[0];
        ob.position[1] = pos[1];
        ob.position[2] = pos[2];
    }
    render();
}
