
## Web APP:
  https://martin-resonance-test.herokuapp.com/

## Technologies Used
  * __S3 Bucket__: This was used to store the files
  * __Lambda__: When a file was uploaded a lambda function generated the thumbnail in another bucket.
  * __DynamoDB__: For storing the url of all thumbnail images.
  
## Libraries Used
  * __axios__: For HTTP calls
  * __react-spinners__: For pretty progress indicators
  * __react-s3__: For uploading the files directly to the S3 Bucket.

## What the page does:
  * Uploads images.
  * See all the images uploaded.
  * Creates a thumbnail for each one.
  * Validates size, type of the file
  * Get the original image when clicking the thumbnail.
  
## Known Issues:
  * Sometimes the thumbnail creation is slow and the page tries to show it before it is created.
  
