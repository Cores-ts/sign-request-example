var { Credentials } = require('uport-credentials')
const axios = require('axios')
const FormData = require('form-data')

/**
Upload your logo:

$ curl  "https://ipfs.infura.io:5001/api/v0/add?pin=true" -F file=@logo.png
{"Name":"logo.png","Hash":"QmV3pEPwSzkQVMPmkvpWRvWRxexdMrCNayMnZeao8dibm4","Size":"5779"}

*/

// Config
const creds={ 
    did: 'did:ethr:0x136dd005fa469e33581b9623ad82b2c8f42bc9d2',
    privateKey: 'f161a002a08b6fc9c6f54b6a0dc9b4622e32fa5a4821a440f0e7761f5880efd0'
}
const claim = {
  name: 'Gorilla Firma',
  url: 'https://www.gorillafirma.com',
  description: 'Gorilla Firma',
  profileImage: {"/": "/ipfs/QmQv5SGMV8Kn1tzqQEA6a6FbC6k2CRXzmVUPVXGmoGKjzB"}, // CHANGE THIS
}

const credentials = new Credentials(creds)

credentials.signJWT({ sub: creds.did, claim }).then(jwt => {
  let data = new FormData()
  data.append('file', jwt);
  return axios.post('https://ipfs.infura.io:5001/api/v0/add?pin=true', data, { 
    headers: {
      'Content-Type': `multipart/form-data; boundary= ${data._boundary}`,
    }
  })
})
.then((res) => {
  console.log(`Add this to your uport requests: vc: ['/ipfs/${res.data.Hash}']`)
})
.catch((error) => {
  console.error(error)
})
