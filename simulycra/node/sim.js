#!/usr/bin/env node

var fs = require("fs");
var os = require("os");
var path = require("path");
var tele = require("telehash");
var argv = require("optimist")
  .default("id", "./seed.json")
  .default("port", 42424)
  .default("simtype", "drone")
  .boolean("bridge").default("bridge",true)
  .boolean("v").describe("v", "verbose")
  .boolean("nolan").describe("nolan", "disable lan usage")
  .describe("ip", "force set the public IP address to override any NAT detection")
  .argv;

if(argv.v) tele.debug(console.log);
tele.info(function(){console.log.apply(console,arguments)});

if(argv.port == 42420)
{
  console.log("that port is reserved");
  process.exit(1);
}

// localize our id file
var idfile = path.join(__dirname, argv.id);

// load the pub/private key or create one
if(fs.existsSync(idfile))
{
  init(require(idfile));
}else{
  tele.genkey(function(err, key){
    fs.writeFileSync(idfile, JSON.stringify(key, null, 4));
    init(key);
  });
}

// right now we're very leaky, so we need this
function safe()
{
  var usage = process.memoryUsage().rss/(1024*1024);
  console.log("RAM",Math.floor(usage));
  if(usage > 500) process.exit(1);
  setTimeout(safe,60*1000);
}
safe();

function init(key)
{
  var seed = tele.hashname(key, {port:parseInt(argv.port), ip:argv.ip, nolan:argv.nolan});
  var Etcd = require('node-etcd');
  var etcd = new Etcd();
  var redishost = etcd.get("/services/redis");
  var redis = require('redis'),
      client = redis.createClient(6379, redishost);
  client.smembers('seed_list', function(err, redis_seeds) {
    redis_seeds.forEach(function(hn){
      client.hgetall("hn/"+hn, function(err, remote) {
        seed.addSeed(remote);
      });
    });
  });
  seed.seeded = true;
  if(!argv.nohttp) seed.http(argv.http, require('socket.io').listen(argv.port, {log:false}));
  seed.bridging = argv.bridge;
  seed.online(function(err){
    var lan4 = seed.paths.lan4 || {};
    var pub4 = seed.paths.pub4 || {};
    var ip = pub4.ip||lan4.ip;
    var port = pub4.port||lan4.port;
    var info = {ip:ip, port:port, ip6:seed.paths.lan6.ip, port6:seed.paths.lan6.port, hashname:seed.hashname, pubkey:key.public};
    if(!argv.nohttp) info.http = seed.paths.http.http;
    if(seed.bridging) info.bridge = true;
    console.log(JSON.stringify(info, null, 4));
    if(client) {
      client.sadd(argv.simtype, seed.hashname);
      client.hmset("hn/"+seed.hashname, info);
    };
    if(seed.nat) console.log("warning, may be behind a NAT, IP and Port may not be stable");
    console.log((err?err:"connected to mesh seed peers"));
  });
  if(client) {
    function tattle()
    {
      known = Object.keys(seed.all);
      if(known.length > 0) {
        client.sadd('routes/'+seed.hashname, known);
      };
      setTimeout(tattle,5*1000);
    }
    tattle();
  };
}
