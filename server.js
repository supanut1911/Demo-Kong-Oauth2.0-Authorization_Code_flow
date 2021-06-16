const express = require('express')
const app = express()
const data = require('./data.json')
const fetch = require("node-fetch");
var cors = require('cors')
app.use(cors())
const getCurrentUser = ({ headers }) => {
    return headers['mock-logged-in-as'] ||
            headers['x-authenticated-userid']
}
const users = [
    {
        id: "001",
        username: "alice",
        password: "123"
    },
    {
        id: "002",
        username: "bob",
        password: "888"
    },
    {
        id: "003",
        username: "jame",
        password: "777"
    },
]

app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: false}))

app.get('/' , (req, res) => {
    res.render('index.ejs')
})

app.post("/login", (req, res) => {
    var username = req.body.username
    var password = req.body.password
    console.log(users.find(us => us == us));
    // if((username == "test") && (password == "123")) {
    //     res.render('authen.ejs', { name : "test"})
    // } else {
    //     console.log('not match');
    // }

    users.forEach(element => {
        if(username == element.username && password === element.password) {
            console.log('match');
            res.render('authen.ejs', { name : username, id: element.id})
        }
    });
    res.render('index.ejs')
    
    
})
  
app.listen(3000)