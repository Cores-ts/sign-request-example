const express = require('express')
const bodyParser = require('body-parser')
const ngrok = require('ngrok')
const decodeJWT = require('did-jwt').decodeJWT
const { Credentials } = require('uport-credentials')
const transports = require('uport-transports').transport
const message = require('uport-transports').message.util

let endpoint = ''
const app = express();
app.use(bodyParser.json({ type: '*/*' }))

//setup Credentials object with newly created application identity.
const credentials = new Credentials({
  appName: 'Gorilla Login Example',
    did: 'did:ethr:0x136dd005fa469e33581b9623ad82b2c8f42bc9d2',
    privateKey: 'f161a002a08b6fc9c6f54b6a0dc9b4622e32fa5a4821a440f0e7761f5880efd0'
})

app.get('/', (req, res) => {
  //Create a new disclosure request, requesting the push notification token and a new key
  credentials.createDisclosureRequest({
    notifications: true,
    accountType: 'keypair',
    networkId: '0x1',
    vc: ['/ipfs/QmWE2pDhzcaa6jN1YQCgisBtBqF5uUCeQrfVAvGqoX4BEx'],
    callbackUrl: endpoint + '/callback'
  }).then(disclosureRequestJWT => {
    console.log(decodeJWT(disclosureRequestJWT))  //log request token to console
    
    //Create QR code with the disclosure request.
    const uri = message.paramsToQueryString(message.messageToURI(disclosureRequestJWT), {callback_type: 'post'})
    const qr =  transports.ui.getImageDataURI(uri)
    res.send(`<div><img src="${qr}"/></div>`)
  })
})

app.post('/callback', (req, res) => {
  const access_token = req.body.access_token
  credentials.authenticateDisclosureResponse(access_token).then(userProfile => {
    console.log({userProfile}, "\n\n")

    const textToSign="some text to sign. A hash maybe?"


    credentials.createPersonalSignRequest(textToSign, {callback: endpoint+'/signature'})
    .then( signRequest => {

      console.log("signRequest:"+signRequest)
      //console.log(decodeJWT(signRequest))  //log request token to console
    
      
      //Push signRequest to user
      const pushTransport = transports.push.send(userProfile.pushToken, userProfile.boxPub)
      return pushTransport(signRequest)
    })
    .then(pushData => {
      console.log("Pushed to user: "+JSON.stringify(pushData))
      
    })

  })
})

app.post(('/signature', (req,res) =>{
  console.log("Signature returned from user")
  console.log(req.body)
}))

// run the app server and tunneling service
const server = app.listen(8088, () => {
  ngrok.connect(8088).then(ngrokUrl => {
    endpoint = ngrokUrl
    console.log(`Login Service running, open at ${endpoint}`)
  })
})