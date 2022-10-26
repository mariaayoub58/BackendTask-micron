1) Create the table users using DDL.sql (Added two additional columns(AUTH_TOKEN and TOKEN_CREATE_TIME to call updateUser and fetchUser API's))
2) Please run "npm install" in the root folder of Backend code to install all node modules
3) Run "node index.js" 
4) Used brcrypt library to store the hashed password
5) Generated a token using random-token library to be used by updateUser and fetchUser API's(No need to further supply passwords). This token is valid for 30 minutes
6) Micron Agritech.postman_collection.json contains the 4 API details
7) DB details are configured in db.config.js, need to change the user name, password, schema if they are different from what was configured
