'use strict';

const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const S3 = new AWS.S3({
  signatureVersion: 'v4',
});
const Sharp = require('sharp');

// set the S3 and API GW endpoints
const SOURCE_BUCKET = process.env.SOURCE_BUCKET;
const DEST_BUCKET = process.env.DEST_BUCKET;
const URL = process.env.URL;

// set allowed sizes
// const ALLOWED_DIMENSIONS = new Set();
// if (process.env.ALLOWED_DIMENSIONS) {
//   const dimensions = process.env.ALLOWED_DIMENSIONS.split(/\s*,\s*/);
//   dimensions.forEach((dimension) => ALLOWED_DIMENSIONS.add(dimension));
// }


exports.handler = (event, context, callback) => {
  const key = event.queryStringParameters.key;

  const match = key.match(/(.*)\/([s|w|h])(\d+x{0,1}\d+)\/(.*)/);

  if (!match) {
    callback(null, {
      statusCode: '403',
      headers: {},
      body: 'Wrong file name',
    });
    return;
  }

  // requested resize direction
  // s: width and height | w: width | h: height
  let direction = match[2];
  // requested size
  let size = match[3];

  let filename = match[4];
  let folder = match[1];

  // determine widht & height for resize
  let width, height;

  switch (direction) {
    case 's':
      width = parseInt(size.split('x')[0], 10);
      height = parseInt(size.split('x')[1], 10);
      break;
    case 'w':
      width = parseInt(size, 10);
      height = null;
      break;
    case 'h':
      width = null;
      height = parseInt(size, 10);
      break;
    default:
      callback(null, {
        statusCode: '403',
        headers: {},
        body: 'Wrong size',
      });
      return;
      break;
  }

  // determine file format
  let extension = filename.split('.')[1];

  let requiredFormat = extension == "jpg" ? "jpeg" : extension;
  // set original jpg filename
  let requiredFile = filename.split('.')[0] + '.jpg';

  if (['jpg', 'png'].includes(extension)) {
    requiredFile = filename;
  }

  let originalFolder = folder.split('/');
  originalFolder.pop();
  originalFolder = originalFolder.join('/');
  // original file in the bucket
  let originalKey = `${originalFolder}/${requiredFile}`;

  // check only allowed sizes
  //
  // if (ALLOWED_DIMENSIONS.size > 0 && !ALLOWED_DIMENSIONS.has(dimensions)) {
  //   callback(null, {
  //     statusCode: '403',
  //     headers: {},
  //     body: '',
  //   });
  //   return;
  // }

  // get S3 object
  S3.getObject({
      Bucket: SOURCE_BUCKET,
      Key: originalKey
    }).promise()
    .then(data => Sharp(data.Body)
      .resize(width, height)
      .toFormat(requiredFormat)
      .toBuffer()
    )
    .then(buffer => S3.putObject({
        Body: buffer,
        Bucket: DEST_BUCKET,
        ContentType: 'image/' + requiredFormat,
        CacheControl: 'max-age=31536000',
        Key: key,
        StorageClass: 'REDUCED_REDUNDANCY'
      }).promise()
      .catch(err => callback(null, {
        statusCode: '404',
        headers: {},
        body: {
          message: 'Error saving the new file.',
          error: JSON.stringify(err)
        }
      })))
    .then(() => {
      callback(null, {
        statusCode: '301',
        headers: {
          'location': `${URL}/${key}`,
          'Cache-Control': 'no-cache'
        },
        body: '',
      })
    })
    .catch(err => callback(null, {
      statusCode: '404',
      headers: {},
      body: {
        message: 'Original file not found.',
        error: JSON.stringify(err)
      },
    }))
};