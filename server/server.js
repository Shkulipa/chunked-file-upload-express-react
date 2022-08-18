const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs')
const md5 = require('md5')

const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.use(bodyParser.raw({
  type: 'application/octet-stream',
  limit: '100mb'
}));

app.post('/upload', (req, res) => {
  const { name, size, currentChunkIndex, totalChunks } = req.query;

  const firstChunk = parseInt(currentChunkIndex) === 0;
  const lastChunk = parseInt(currentChunkIndex) === parseInt(totalChunks) - 1;

  const ext = name.split('.').pop();
  const data = req.body.toString().split(',')[1];
  const buffer = new Buffer.from(data, 'base64');

  const tempFilename = md5(name + req.ip) + '.' + ext;

  // unlinkSync - delete file
  if(firstChunk && fs.existsSync('./uploads/'+tempFilename)) {
    fs.unlinkSync('./uploads'+tempFilename);
  }
  
  fs.appendFileSync('./uploads/'+tempFilename, buffer);
  if(lastChunk) {
    const finalFilename = md5(Date.now()).substring(0, 6) + '.' + ext;
    fs.renameSync('./uploads'+tempFilename, './uploads'+finalFilename);
    res.json({ finalFilename });
  } else {
    res.json('ok')
  }
})

app.listen(4000, () => {
  console.log('Server started on the 4000 port')
})