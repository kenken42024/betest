
import dotenv from 'dotenv';
import { S3Client } from "@aws-sdk/client-s3";

dotenv.config()

// const awsBucket = process.env.AWS_BUCKET
const awsBucketRegion = process.env.AWS_BUCKET_REGION
const awsS3AccessKey = process.env.AWS_S3_ACCESS_KEY
const awsS3SecretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY

const s3 = new S3Client({
    credentials: {
        accessKeyId: awsS3AccessKey,
        secretAccessKey: awsS3SecretAccessKey
    },
    region: awsBucketRegion
})

export { s3 }