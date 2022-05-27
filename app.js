import twilio from "twilio";
import cron from "cron";
import dotenv from "dotenv";
import express from 'express';
import flybase from 'flybase';
dotenv.config();

var client = twilio(process.env.ACCOUNTSID,process.env.AUTHTOKEN);
const MessagingResponse= twilio.twiml.MessagingResponse;
console.log(`${process.env.ACCOUNTSID}:${process.env.AUTHTOKEN}:${process.env.YOURPHONENUMBER}`)
const app=express()

const flybase_api_key=process.env.FLYBASEAPIKEY;
const db="dailysms";
const collection="users";
const usersRef= flybase.init(db,collection,flybase_api_key)

const numbers = [

];
const textJob = new cron.CronJob(
  "56 2 * * *",

  function () {
    for (var i = 0; i < numbers.length; i++) {

      client.messages.create({
            body: `Hello! Hope you’re having a good day.`,
            from: process.env.YOURPHONENUMBER,
            to: numbers[i]
          })
         .then(message => console.log(message.body));
    }
  },
  null,
  true
);


app.use(express.json());
app.use(express.urlencoded({extended : true}))


usersRef.on('value', function(snapshot) {
    snapshot.forEach( function( rec ){
         numbers.push( rec.value().phonenumber );
         console.log( 'Added number ' + rec.value().phonenumber
);
    });
});
usersRef.on('added', function(snapshot) {
   numbers.push( snapshot.value().phonenumber );
   console.log( 'Added number ' +
snapshot.value().phonenumber );
});


app.post('/message', function (req, res) {
    const twiml = new MessagingResponse();
    console.log(req.body)

    if( req.body.Body.trim().toLowerCase() === 'subscribe' ) {
         var fromNum = req.body.From;
         if(numbers.indexOf(fromNum) !== -1) {
              twiml.message('You already subscribed!');
         } else {
              twiml.message('Thank you, you are now subscribed. Reply "STOP" to stop receiving updates.');
              usersRef.push({phonenumber:fromNum});
         }
    } else {
         twiml.message('Welcome to Daily Updates. Text "Subscribe" receive updates.');
    }
    res.writeHead(200, {
         'Content-Type':'text/xml'
    });
    res.end(twiml.toString());
});


const server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});
  