/*      Mise en place des variables constantes      */
const Discord = require("discord.js"),
      client = new Discord.Client();

const fs = require("fs");

const mysql = require("mysql2");

const invites = {};

const replaceOnce = require("replace-once");

const wait = require("util").promisify(setTimeout);

const config = require("./databases/config/mysql.json");

const shell = require("shelljs");

/*      Création de la liaison à la base de donnée      */
client.config = config;

const sqlconnection = mysql.createConnection({
    host: config.savanaData1.host,
    user: config.savanaData1.username,
    password: config.savanaData1.password,
    database: config.savanaData1.database
})

/*      Connection au bot et configuration      */
var token = "";

sqlconnection.connect(function(err) {
    if (err) throw err.stack;

    console.log("Connected to MySQL API")

    sqlconnection.query("SELECT * FROM `settings`", function (err, result, fields){
        if (err) throw err.stack;

        token = result[0].token;

        client.login(token);

        var activities = [];

        for (var i = 0; i < result.length; i++){
            activities.push(result[i].statut);
        };

        console.log("Connecting to Discord.JS API V12..")

        client.on("ready", () => {
            console.log("Connected to Discord.JS API v12")
            client.user.setActivity(activities[0], {
                type: "PLAYING",
                url: "https://github.com/Savana-Manager"
            });
    
            client.setInterval(() => {
                const index = Math.floor(Math.random() * activities.length);
    
                client.user.setActivity(activities[index], {
                    type: "PLAYING",
                    url: "https://github.com/Savana-Manager"
                });
            }, 10 * 60000);
        });
    });
});

/*      Création des events     */
fs.readdir("./events/", (err, content) => {
    if(err) throw err.stack;
    if(content.length < 1) return console.log("Please create folders in the events folder !");
    
    var groups = [];

    content.forEach(element => {
        if (!element.includes('.')) groups.push(element)
    });

    groups.forEach(folder => {
        fs.readdir("./events/" + folder, (e, files) => {
            
            let js_files = files.filter(f => f.split(".").pop() === "js");

            if(js_files.length < 1) return console.log(`Please create files in ${folder}`);

            if(e) throw e;

            js_files.forEach(element => {
                let event = require(`./events/${folder}/${element}`);
                let eventName = element.split(".")[0];
                client.on(eventName, event.bind(null, client, sqlconnection));
            });
        });
    });
});


/*      Création des commandes      */
client.commands = new Discord.Collection();

fs.readdir(`./commands/`, (err, content) => {
    if(err) throw err;

    if(content.length < 1) return console.log("Please create folders in the commands folder !");

    var groups = [];

    content.forEach(element => {
        if(!element.includes('.')) groups.push(element);
    });

    groups.forEach(folder => {
        fs.readdir(`./commands/` + folder, (e, files) => {
            let js_files = files.filter(f => f.split(".").pop() === "js");

            if(js_files.length < 1) return console.log(`Please create files in ${folder}`);

            if(e) throw e;

            js_files.forEach(element => {
                let props = require(`./commands/${folder}/${element}`);

                client.commands.set(element.split(".")[0], props);
            });
        });
    });
});
