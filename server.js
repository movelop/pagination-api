const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const Article = require('./models/articles');

const methodOverride = require ('method-override');
const bodyParser = require('body-parser');
const articleRouter = require('./routes/articles');



const app = express();

// connecting to mongoose

console.log('connecting to mongoDB')
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
},
(err) => {
    if(err) return console.error(err);
    console.log('mongoDB connection established');
}   
)


app.set("view engine", 'ejs')

app.use(express.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(cors());
app.use(express.json());



app.get('/', async (req, res) =>{
    const articles = await Article.find().sort({createdAt: 'desc'});
    res.render("articles/index", {articles:articles});
})




app.use ('/articles', articleRouter);
app.use('/posts', require('./routes/postRoute'));
app.use('/file', require('./routes/bookRoute'));
app.use('/video', require('./routes/videoRoute'));




const PORT = process.env.PORT || 4000
app.listen(PORT, ()=> console.log(`server started on port: ${PORT}`));

// create storage Engine


