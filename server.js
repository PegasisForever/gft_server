var express = require('express');
var multer = require('multer');
var mysql = require('mysql');
var https = require('https');
var fs = require('fs');
var get_sql_connection = require("./get_sql_connection.js");
var bodyParser = require('body-parser');
const privateKey = fs.readFileSync('/etc/letsencrypt/live/test.pegasis.site/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/test.pegasis.site/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/test.pegasis.site/chain.pem', 'utf8');
const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var httpsServer = https.createServer(credentials, app);

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)
    }
});
var upload = multer({storage: storage});

var connection = get_sql_connection();
connection.connect();

app.post('/upload_file', upload.single('file'), function (req, res, next) {
    res.send(req.file.originalname);
    console.log(req.file.originalname);
    console.log(req.body.to_device_id);
});

app.post("/new_device", upload.none(), function (req, res) {
    var deviceID=Math.floor(Math.random()*99999);
    var deviceName=req.body.device_name;
    console.log(deviceName);
    connection.query("insert into devices (id, name) values (?,?);",
        [deviceID, deviceName], function (err, rows, fields) {
            if (err) {
                console.log(err);
                res.send(JSON.stringify({
                    status: -1,
                }))
            }else {
                console.log("New user: "+deviceName+" "+deviceID);
                res.send(JSON.stringify({
                    status: 0,
                    device_id: deviceID
                }))
            }
        });

});

httpsServer.listen(4388, function() {
    console.log('HTTPS Server is running on: http://localhost:4388');
});