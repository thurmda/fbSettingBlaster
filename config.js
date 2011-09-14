var config = module.exports = {
	csvIn : {
		delimiter : ';',
		columns : true
	},
	csvOut :{
		delimiter : ',',
		lineBreaks: 'unix',
		columns: ['fb_appid', "api_secret", "name", "result"]
	},
	https : true,
	maxSockets: 500,
	basePostOptions : {
	    port : '443',
	    method : 'POST',
	    headers : {
			'Content-Type' : 'application/x-www-form-urlencoded'}
	    },
	 properties : {
	 	get: ['profile_tab_url', 'locale', 'base_domain'],
	 	set:{
			 base_domain : 'buddymedia.com',
			 locale : "fr_FR"
			}
		}
}