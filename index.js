/*
    @name ViciAuthSDK
    @version 1.0
    @desc Client Authentification Module to Communicate with ViciAuthAPI.
    @author Adrian Barwicki

    @copyright
    ViciQloud UG (haftungsbeschränkt)
    Robert-Bosch-Strasse 49
    69190 Walldorf
    adrian.barwicki@viciqloud.com
*/

var request = require("request");
var UserModel = require("./models/user");
var FbConfigModel = require("./models/fbConfig.js");

var VERSION = "1.0.0";


var OPTS = {
    host: 'viciauth.com',
    port: 80,
    prefix: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'ViciAuth/Node-v1.0'
    }
};



module.exports = initSDK;
	

function initSDK(ConfigKeys,expressApp,passport) {

  ConfigKeys = ConfigKeys || {};
    
  if(!ConfigKeys.appKey||!ConfigKeys.apiKey){
    throw "[ViciAuthSDK] AppKey or ApiKey not specified";
  }

    
  var API_URL = OPTS;    
  var API_KEY = ConfigKeys ? ConfigKeys.apiKey : null;
  var APP_KEY = ConfigKeys ? ConfigKeys.appKey : null; 
  if( !APP_KEY || !API_KEY ){
    throw "[ERROR] [ViciQloudSDK] Missing APP KEY or API KEY!"
  }
  
  var ViciAuth = (new ViciAuthSDK(API_URL,APP_KEY,API_KEY));
  
    
  if(expressApp&&passport){
      ViciAuth.configureRoutes(expressApp,passport);  
  }

  return ViciAuth;
}


var ViciAuthSDK = (function(){
 
var ViciAuthSDK = function(apiUrl,apiKey,appKey){
    
    // private attrs
    var API_URL = apiUrl;
    var API_KEY = apiKey;
    var APP_KEY = appKey;


    // extends  
    this.Models={
      User : UserModel
    };

    
 
    this.FbConfig=new FbConfigModel;

    this.addToProfileFields = function(profileField){
        this.profileFields.push(profileField);
    };
    
    this.configureRoutes = configureRoutes;

    // resources    
    this.checkToken = checkToken;
    this.connectToFacebook = connectToFacebook;
    this.localSignup = localSignup; 
    this.localLogin = localLogin;
 

    function configureRoutes(app){
      require("./routes")(app,this.FbConfig,this.connectToFacebook);  
    }


    // RESOURCES    
    function checkToken(token,callback){
        var postBody  = { token : token  };
        ViciAuthSDK.call("/auth/token",postBody,callback);	
    }    


    function connectToFacebook(token,refreshToken,Profile,callback){
        var postBody  = { token : token, refreshToken : refreshToken, Profile : Profile };
        ViciAuthSDK.call("/auth/networks/facebook",postBody,callback);
    }


    function localSignup(email,password,callback){
        var postBody  = { email : email, password : password };
        ViciAuthSDK.call("/auth/local/signup",postBody,callback);
    }


    function localLogin(email,password,callback){
        var postBody  = { email : email, password : password };   
        ViciAuthSDK.call("/auth/local/login",postBody,callback)    
    }


    ViciAuthSDK.prototype.call = function(uri, params, callback) {
         params = params || {};

         var requestOptions = OPTS;
         requestOptions.headers['x-auth-viciauth-app-key'] = APP_KEY;
         requestOptions.headers['x-auth-viciauth-api-key'] = APP_KEY;
         requestOptions.headers['x-auth-viciauth-token'] = params.token

         var options = {
          url: OPTS.API_URL + uri,
          headers: requestOptions
        };


        options.form = params;
        request.post(options, (err, response, body) => {
          if(err){
            try{
              err = JSON.parse(err);
            }catch(e){
              err = {};
            }
            return callback({status:502,err:err});
          }

          if(body){
            try{
              body = JSON.parse(body);
            }catch(err){
              console.error("[ERROR] ViciAuthSDK : Something went wrong");
              console.error(err);
              body = {};
              return callback(err);
            }
          } else {
             body = {};
          }

          if (response.statusCode !== 200) {
            return callback({status:response.statusCode, err : body});
          }

          return callback(null,body);

        });      
    };    
    
  

}

return ViciAuthSDK;  
}());
