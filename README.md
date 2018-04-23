From project root folder, run the following commands:

The Dockerfile is configured to download Amazon Linux and install Node.js 6.10 along with dependencies.

```docker build --tag amazonlinux:nodejs .```

Update AWS Account ID value in BUCKET variables used in code snippet 2 above. The AWS CloudFormation template will create the bucket in pattern ‘image-resize-${AWS::AccountId}-us-east-1′.

For example, if your AWS Account ID is 123456789012, then BUCKET variable would be updated to ‘image-resize-123456789012-us-east-1’. 

If you already have an S3 bucket then update this variable accordingly and modify your CloudFront distribution Origin settings to reflect the same.
Install the sharp and querystring module dependencies and compile the ‘Origin-Response’ function.

```docker run --rm --volume ${PWD}/lambda/origin-response-function:/build amazonlinux:nodejs /bin/bash -c "source ~/.bashrc; npm init -f -y; npm install sharp --save; npm install querystring --save; npm install --only=prod"```

Install the querystring module dependencies and compile the ‘Viewer-Request’ function.

```docker run --rm --volume ${PWD}/lambda/viewer-request-function:/build amazonlinux:nodejs /bin/bash -c "source ~/.bashrc; npm init -f -y; npm install querystring --save; npm install --only=prod"```

Package the ‘Origin-Response’ function.

```mkdir -p dist && cd lambda/origin-response-function && zip -FS -q -r ../../dist/origin-response-function.zip * && cd ../..```

Package the ‘Viewer-Request’ function.

```mkdir -p dist && cd lambda/viewer-request-function && zip -FS -q -r ../../dist/viewer-request-function.zip * && cd ../..```

From AWS console, create S3 bucket in us-east-1 region to hold the deployment files and upload the zip files created in above steps. These would be referenced from the CloudFormation template during deployment.