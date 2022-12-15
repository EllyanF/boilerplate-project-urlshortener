require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('node:dns');
const urlParser = require('url');
const mongoose = require('mongoose');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

const UrlSchema = new mongoose.Schema({
  original_url: { type: String, required: true }
});

const Url = mongoose.model('URL', UrlSchema);

const connection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(mongoose.connection.readyState);
  } catch (err) {
    console.error(err);
  }
}

app.use(bodyParser.urlencoded({ extended: false }))

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req, res) => {
  connection();
  var urlSent = req.body.url;
  dns.lookup(urlParser.parse(urlSent).hostname, (err, address) => {
    if (!address) {
      return res.json({ error: 'invalid url' });
    }
  });

  await Url.create({ original_url: urlSent }, (err, data) => {
    err ? console.error(err) : res.json({
      "original_url": data.original_url, "short_url": data._id
    })
  });
});

app.get('/api/shorturl/:short_url/', (req, res) => {
  connection();
  var shortUrl = req.params.short_url
  Url.findById(shortUrl, (err, urlFound) => {
    console.log(urlFound);
    err ? console.error(err) : res.redirect(urlFound.original_url);
  });
});


app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
