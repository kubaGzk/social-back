const {
  AWS_ACC_KEY,
  AWS_SEC_KEY,
  AWS_S3_BUCKET,
  AWS_REGION,
} = require("../config");
const { v4: uuid } = require("uuid");
const aws = require("aws-sdk");

const s3upload = (stream) => {
  aws.config.setPromisesDependency();

  aws.config.update({
    accessKeyId: AWS_ACC_KEY,
    secretAccessKey: AWS_SEC_KEY,
    region: AWS_REGION,
  });

  const s3 = new aws.S3();

  //eslint-disable-next-line global-require
  const s3Stream = require("s3-upload-stream")(s3);

  const fileKey = uuid();

  const upload = s3Stream.upload({
    Bucket: AWS_S3_BUCKET,
    ACL: "public-read-write",
    Key: fileKey,
    ContentType: "image/jpeg",
  });

  upload.maxPartSize(20971520);
  upload.concurrentParts(5);

  return new Promise((resolve, reject) => {
    stream
      .pipe(upload)
      .on("uploaded", () => {
        resolve(fileKey);
      })
      .on("error", (err) => {
        console.log(err);
        reject(err);
      });
  });
};

const fileUpload = async (file) => {
  const { createReadStream } = await file;
  const stream = createReadStream();
  const fileKey = await s3upload(stream);
  return fileKey;
};

module.exports = fileUpload;
