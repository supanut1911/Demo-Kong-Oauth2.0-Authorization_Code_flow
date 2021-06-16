const fs = require('fs')
const express = require('express')
const app = express()
const data = require('./data.json')
const https = require('https')
const SSL_CERT = fs.readFileSync('./certificates/cert.pem')
const SSL_KEY =  fs.readFileSync('./certificates/key.pem')
const port = 7788
require('dotenv').config();
const axios = require('axios')
var cors = require('cors')

const agent = new https.Agent({
  rejectUnauthorized: false
})

app.use(cors())
app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: false}))

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

const getCurrentUser = ({ headers }) => {
  return headers['mock-logged-in-as'] ||
         headers['x-authenticated-userid']
}

//API RESOURCE SERVER
app.get('/verify', (req, res) => {
  console.log(req.headers)
  const user = getCurrentUser(req)
  if (!user) {
    res.status(401).send('Not authorized')
    return
  }
  res.send(data[user] || [])
  // res.render('YewllowDuckStoreIndex.ejs', { name : data[user].email})
})

//API web backend for authorized 
app.post('/kong/oauth2/authorize', async  (req, res) => {
  try {
      let oauth2PluginDetail = await getServicePluginByServiceName('resource-api-server')
      let oauth2PluginDetailJSONConfig = oauth2PluginDetail[0].config

      let response = await axios({
        method: 'post',
        url: 'https://192.168.1.119:9443/api/authen/oauth2/authorize',
        data:{
          "client_id": process.env.CONSUMER_CLIENT_ID,
          "response_type": "code",
          "scope":oauth2PluginDetailJSONConfig.scopes[2],
          "provision_key": oauth2PluginDetailJSONConfig.provision_key,
          "authenticated_userid": req.body.id
        },
        agent
      })
      response = JSON.stringify(response.data.redirect_uri)
      console.log('oauth2/authorize => ',response);
      let indexEqual = response.indexOf('=')
      let code = response.substring(indexEqual + 1, )

      let exchange = await exchangeToken(code)

      let authorizeRes = await authorize(exchange.access_token)

      console.log('authorizeRes : ', authorizeRes);
      // res.send(authorizeRes)
      res.render('YewllowDuckStoreIndex.ejs', { value : authorizeRes })
  } catch (error) {
      console.log('hi error:',error.message);
  }
}) 



//API KONG FOR exchange Authorize code to Accesss token
exchangeToken = async (authTokenCode) => {
  authTokenCode = authTokenCode.replace('"','')
  authTokenCode = authTokenCode.trim()
  try {
    let exchangeToken = await axios({
      method: 'post',
      url: 'https://localhost:9443/api/authen/oauth2/token',
      data:{
          "grant_type": "authorization_code",
          "code": authTokenCode,
          "client_id":"Pjpxxd48HwTZutMpQW1Tf0OvMtrw1Zs6",
          "client_secret": "1VXqXWjtp8jIh2M0oKUlRuI5YMdhJa1U"
      },
      agent
    })      
    return exchangeToken.data
  } catch (error) {
    throw error
  }
}

//API KONG FOR authoirze and get data 
authorize = async (accessToken) => {
  console.log('accessToken is ', accessToken);
  try {
    let authorizeRes = await axios({
      method:'get',
      url: 'https://localhost:9443/api/authen/verify',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    return authorizeRes.data
  } catch (error) {
    throw error
  }
}

//API KONG FOR get Pugin service detail by service name for PROVISION_KEY
getServicePluginByServiceName = async(serviceName) => {
  try {
    let res = await axios({
      method:'get',
      url: `https://localhost:9444/services/${serviceName}/plugins`
    })
    // console.log(res.data.data);
    return res.data.data
  } catch (error) {
    console.log(error);
    throw error
  }

}



const server = https.createServer({ key: SSL_KEY, cert: SSL_CERT }, app)
server.listen(port, () => {
  console.log(`Server is listening on https://localhost:${port} `)
})

