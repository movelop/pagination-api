const express = require ('express')
const router = express.Router();
const  Article = require('./../models/articles');


router.get('/', async(req, res) =>{
    const PAGE_SIZE = 10;
    const page = parseInt(req.query.page || 0);
    const total = await Article.countDocuments({});
    const posts = await Article.find().sort({createdAt: "desc"} )
    .limit(PAGE_SIZE)
    .skip(PAGE_SIZE * page);
    res.json({totalPages: Math.ceil(total/PAGE_SIZE) ,posts}); 
});

router.get('/:id', async (req, res) => {
    const post = await Article.findById(req.params.id);
    res.json(post);
} )

module.exports = router