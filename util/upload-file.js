const {
  AWS_ACC_KEY,
  AWS_SEC_KEY,
  AWS_S3_BUCKET,
  AWS_REGION,
} = require("../config");
const { v4: uuid } = require("uuid");
const aws = require("aws-sdk");

const fileUpload = async (file) => {
  const { createReadStream, filename, mimetype } = await file;
  const stream = createReadStream();
  const fileKey = await s3upload(stream);
  return fileKey;
};

const s3upload = async (stream) => {
  aws.config.setPromisesDependency();

  aws.config.update({
    accessKeyId: AWS_ACC_KEY,
    secretAccessKey: AWS_SEC_KEY,
    region: AWS_REGION,
  });

  const s3 = new aws.S3();

  const s3Stream = require("s3-upload-stream")(s3);

  const fileKey = uuid();

  const upload = s3Stream.upload({
    Bucket: AWS_S3_BUCKET,
    ACL: "public-read-write",
    Key: fileKey,
  });

  upload.maxPartSize(20971520);
  upload.concurrentParts(5);

  return new Promise((resolve, reject) => {
    stream
      .pipe(upload)
      .on("part", (details) => {})
      .on("uploaded", (resp) => {
        resolve(fileKey);
      })
      .on("error", (err) => {
        console.log(err);
        reject(err);
      });
  });
};

module.exports = fileUpload;
