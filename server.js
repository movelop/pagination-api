const express = require ('express');
const mongoose = require('mongoose');
const cors = require('cors');


app = express();




app.use(cors());
app.use(express.json());

app.get('/posts', async(req, res) => {
    const PAGE_SIZE = 3
    const page = parseInt(req.query.page || 0);
    const total =await Post.countDocuments({})
    const posts = await Post.find({})
    .limit(PAGE_SIZE)
    .skip(PAGE_SIZE * page);
    res.json({totalPages : Math.ceil(total/PAGE_SIZE),
         posts});
})



console.log('connecting to mongoDB')
mongoose.connect("mongodb://localhost/mycustomer", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
},
(err) => {
    if(err) return console.error(err);
    console.log('mongoDB connection established');
}   
)
const db = mongoose.connection;
db.once("open", () => {
    app.listen(5000);
})
const postSchema = new mongoose.Schema({
    text:{
        type:String,
    },
    title: {
        type: String,
    }
})

const Post = mongoose.model("Post", postSchema);