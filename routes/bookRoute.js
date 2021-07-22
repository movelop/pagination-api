const express = require ('express');
const router = express.Router();
const Grid = require('gridfs-stream');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const mongoose = require ('mongoose');
const crypto = require('crypto');
const path = require('path');

// mongoose connect
MONGODB_URI = 'mongodb://localhost/blog'
const conn = mongoose.connection

// init gfs
let gfs;
conn.once('open', () => {
    // intitialize stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
})

const storage = new GridFsStorage({
  url: MONGODB_URI,
  options:{useUnifiedTopology: true},
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        // const filename = buf.toString('hex') + path.extname(file.originalname);
        let filename = file.originalname
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });


// route Get/
// Loads form
router.get ('/', (req,res) => {
    gfs.files.find().sort({uploadDate: -1}).toArray((err,files)=>{
        // check for files
        if(!files || files.length === 0) {
            res.render('books/index', {files:false})
        } else{
            files.map(  file => {
                if(
                    file.contentType === 'image/png' ||
                    file.contentType === "image/jpeg" ||
                    file.contentType === "image/jpg"
                  ) {
                    file.isImage = true
                } else {
                    file.isImage = false
                }
            });
            res.render('books/index', {files: files})
        }

        
    })
    
})

// route POST/ upload
// Uploads file to Db

router.post ('/upload', upload.single('file'), (req, res)=>{
    // res.json({file:req.file})
    // console.log(req.file.originalname)
    res.redirect('/file')
} )

// route Get /files
// display all files;
router.get('/files', async(req, res) =>{
     const PAGE_SIZE = 10;
    const page = parseInt(req.query.page || 0);
    const total = await gfs.files.countDocuments({});
    const files = await  gfs.files.find()
        .limit(PAGE_SIZE)
        .skip(PAGE_SIZE * page)
        .sort({uploadDate: -1}).toArray()

    res.json({totalPages: Math.ceil(total/PAGE_SIZE) ,files})
})

// route Get /files:filename
// display single file
router.get('/files/:filename', (req, res) =>{
    gfs.files.findOne({filename: req.params.filename}, (err, file) =>{
        // check for file
        if(!file || file.length === 0) {
            return res.status(404).json({
                err: "No file exist"
            });
        }

        // file exist
        return res.json(file)
    })

})


// route Get /download/:filename
// download file

router.get ('/download/:filename', (req, res) => {
    gfs.files.findOne({filename: req.params.filename}, (err, file) => {
        // check for file
        if(!file || file.length === 0) {
            return res.status(404).json({
                err: "No file exist"
            });
        }
        // check if document
        if(file.contentType === "application/pdf" || file.contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
) {
	fileName = `${req.params.filename}`
 res.set({
	"Accept-Ranges": "bytes",
	"Content-Disposition": `attachment; filename= ${req.params.filename}`,
	"Content-Type": "application/pdf" || "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	});
            const readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
        } else {
            res.status(404).json({
                err: "not a document"
            })
        }
    })
});

// route Delete /files/:id
// delete file
router.delete('/files/:id', (req, res)=> {
    gfs.remove({_id: req.params.id, root:"uploads"}, (err, gridStore) =>{
        if(err) {
            return res.status(404).json({err: err})
        } res.redirect("/file")
    })
})


module.exports = router
