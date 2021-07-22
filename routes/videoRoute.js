const express = require ('express');
const router = express.Router();
const Grid = require('gridfs-stream');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const mongoose = require ('mongoose');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

// mongoose connect
MONGODB_URI = process.env.MONGODB_URI
const conn = mongoose.connection

// init gfs
let gfs;
conn.once('open', () => {
    // intitialize stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('videos');
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
          bucketName: 'videos'
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
            res.render('videos/index', {files:false})
        } else{
            files.map(  file => {
                if(
                    file.contentType === 'video/mp4' ||
                    file.contentType === "video/mkv" ||
                    file.contentType === "video/3pg"
                  ) {
                    file.isVideo = true
                } else {
                    file.isVideo = false
                }
            });
            res.render('videos/index', {files: files})
        }

        
    })
    
})

// route POST/ upload
// Uploads file to Db

router.post ('/upload', upload.single('file'), (req, res)=>{
    // res.json({file:req.file})
    
    res.redirect('/video')
} )

// route Get /files
// display all files;
router.get('/videos', async (req, res) =>{
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
router.get('/videos/:filename', (req, res) =>{
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

router.get ('/show/:filename', (req, res) => {
    
    
    gfs.files.findOne({filename: req.params.filename}, (err, file) => {
        // check for file
        if(!file || file.length === 0) {
            return res.status(404).json({
                err: "No file exist"
            });
        }

        
        // check if document
         // create response headers
        const rang = req.headers['range'];
	const fileSize = file.length 
        if(rang) {
        const parts = rang.replace(/bytes=/, '').split('-')
        const partialStart = parts[0];
        const partialEnd = parts[1];
        const start = parseInt(partialStart, 10);
        const end = partialEnd? parseInt(partialEnd, 10) : fileSize-1
        const contentLength = end - start + 1;
        
        const headers = {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": file.contentType,
        };
        // HTTp status 206 for partial content
        res.writeHead(206,  headers);
        const readstream = gfs.createReadStream({filename:file.filename, range:{startPos: start,endPos: end}});
        readstream.pipe(res);
        } else {
            const header = {
                'Content-Length': fileSize,
                'Content-Type': file.contentType,
            }
            res.writeHead(200, header);
            gfs.createReadStream(file.filename).pipe(res)
        }  
        
        })
})
// route Delete /files/:id
// delete file
router.delete('/videos/:id', (req, res)=> {
    gfs.remove({_id: req.params.id, root:"videos"}, (err, gridStore) =>{
        if(err) {
            return res.status(404).json({err: err})
        } res.redirect("/video")
    })
})
 

module.exports = router
