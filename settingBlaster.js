#!/Users/danthurman/local/node/bin/node
/*
See http://developers.facebook.com/docs/appproperties/ for a list of properties
*/
var config = require('./config'),
	csv = require('csv'),
	http = require('http'),
	https = require('https'),
	querystring = require('querystring'),

	start = new Date(), total, errors = [],
	clargs = process.argv.splice(2),
	method = clargs[0] == "set" ? setAppProperties : getAppProperties,
	properties = clargs[0] == "set" ? config.properties.set : config.properties.get,
	inputCSV = clargs[1] || 'applications.csv', in_,
	outputCSV = clargs[2] || 'results.csv', out_,
	httpClient = config.https ? https : http;

	if(clargs[0] == "get"){
		config.csvOut.columns = config.csvOut.columns.concat(config.properties.get);
	} 
	
	in_ = csv()
		.fromPath(__dirname+'/'+inputCSV, config.csvIn)
		.on('data',processData)
		.on('end', function(c){total = c});

	out_ = csv()
		.toPath(__dirname+'/'+outputCSV, config.csvOut)
		.on('data', function(data,i){
			if(i>0) return;
			this.writeStream.write(this.writeOptions.columns.join(this.writeOptions.delimiter) + 
		 							 this.writeOptions.lineBreaks);
		});

	process.on('exit', function () {
		var diff = ((new Date())- start) / 1e3;
		console.log("This batch contained %d applications and took %d seconds (%d/sec) with %d errors.", 
			total, diff, total/diff, errors.length);
		console.dir(errors);
		out_.end();
	});

function processData(app, i ){
		getAccessToken(app, function(e, token){
			e ? err(e) : method(token, properties,function(e, data){
				if(e){
					err(e);	
				}else{
					if(data){
						console.dir(app);
						console.dir(data);
						app = merge(app, data);
						console.dir(app);
					}
				  	out_.write(app);
				}
			});
		});
		function err(e){
			console.warn("ERROR updating application[%s] Err: ", app.name, app.error = e);
			errors.push(app);
		}
}
function getAccessToken(app, cb){
	var postData  = {
			grant_type :'client_credentials',
			client_id : app.fb_appid,
			client_secret : app.api_secret},
		postOptions = config.basePostOptions;
			postOptions.host = 'graph.facebook.com';
		    postOptions.path = '/oauth/access_token';
		post(postOptions, postData, function(rtn){
			(rtn.substr(0, 12) == "access_token") ?
			   cb(undefined, rtn.substr(13)) : cb(rtn);
		});
}
function setAppProperties(access_token, properties, cb){
		var postData  = {
			properties: JSON.stringify(properties),
			access_token : access_token},
		postOptions = config.basePostOptions;
			postOptions.host = 'api.facebook.com';
		    postOptions.path = '/method/admin.setAppProperties';
	    post(postOptions, postData, function(rtn){
			(/>1<\/admin_setAppProperties_response>$/.test(rtn)) ?
				cb(undefined) : cb(rtn);
		});
}
function getAppProperties(access_token, properties, cb){
		var postData  = {
			properties: JSON.stringify(properties),
			access_token : access_token,
			format: 'json'},
		postOptions = config.basePostOptions;
			postOptions.host = 'api.facebook.com';
		    postOptions.path = '/method/admin.getAppProperties';
	    post(postOptions, postData, function(rtn){
	    	var j = JSON.parse(JSON.parse(rtn));
	    	//OMG really fb?!
	    	//console.dir({raw: rtn, j: j});
			cb(undefined, j);
		});
}
function post(postOptions, postData, cb){
		postData = querystring.stringify(postData);
		postOptions.headers['Content-Length'] = postData.length;
		postOptions.agent =  httpClient.getAgent(postOptions.host, config.https? 443:80);
		postOptions.agent.maxSockets = config.maxSockets;
	    post_ = httpClient.request(postOptions, function(res) {
	    		  var rtn = '';
			      res.setEncoding('utf8');
			      res.on('data', function (chunk) {rtn += chunk;});
			      res.on('end', function(){cb(rtn);});
			  });
		post_.write(postData);
		post_.end();	
}
function merge(a, b){
	for (var prop in b){
		a[prop] = b[prop];
	}
	return a;
} 
